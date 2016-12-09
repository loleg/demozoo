(function($) {
	window.MediaLightbox = function() {
		this.mediaItem = null;

		this.overlay = $('<div class="media_lightbox_overlay"></div>');
		this.mediaWrapper = $('<div class="media_lightbox_wrapper"></div>');
		this.closeButton = $('<a href="javascript:void(0);" class="lightbox_close" title="Close">Close</div>');

		$('body').append(this.overlay, this.mediaWrapper);
		this.mediaWrapper.append(this.closeButton);

		this.overlay.css({
			'opacity': 0.5
		});

		var self = this;
		this.overlay.click(function() {
			self.close();
		});
		this.closeButton.click(function() {
			self.close();
		});
		this.onResize = function() {
			self.refreshSize();
		};
		$(window).resize(this.onResize);
		this.keyCodeActions = {
			27: function() {self.close();} /* escape key */
		};
		this.onKeydown = function(evt) {
			var action = self.keyCodeActions[evt.keyCode];
			if (action) action();
		};
		$(window).keydown(this.onKeydown);

		this.refreshSize();
	};

	window.MediaLightbox.prototype.close = function() {
		$(window).unbind('resize', this.onResize);
		$(window).unbind('keydown', this.onKeydown);
		this.overlay.remove();
		this.mediaWrapper.remove();
		if (this.onClose) this.onClose();
	};
	window.MediaLightbox.prototype.getAvailableDimensions = function() {
		var browserWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
		var browserHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

		var maxMediaWidth = browserWidth - 64;
		var maxMediaHeight = browserHeight - 64;

		return {
			browserWidth: browserWidth,
			browserHeight: browserHeight,
			maxMediaWidth: maxMediaWidth,
			maxMediaHeight: maxMediaHeight
		};
	};
	window.MediaLightbox.prototype.refreshSize = function() {
		/* Adjust element sizes to fit browser size. Called on initial load and on resize. */
		var dims = this.getAvailableDimensions();

		this.overlay.css({
			'width': dims.browserWidth,
			'height': dims.browserHeight
		});

		if (this.mediaItem) {
			this.mediaItem.setSize(dims.maxMediaWidth, dims.maxMediaHeight);
		}
	};
	window.MediaLightbox.prototype.attach = function(mediaItemView) {
		this.mediaItem = mediaItemView;
		var dims = this.getAvailableDimensions();
		this.mediaItem.setSize(dims.maxMediaWidth, dims.maxMediaHeight);
	};
	window.MediaLightbox.prototype.detach = function() {
		if (this.mediaItem) {
			this.mediaItem.unload();
			this.mediaItem = null;
		}
	};
	window.MediaLightbox.prototype.setSize = function(width, height) {
		var dims = this.getAvailableDimensions();
		this.mediaWrapper.css({
			'left': (dims.browserWidth - (width + 32)) / 2 + 'px',
			'top': (dims.browserHeight - (height + 32)) / 2 + 'px',
			'width': width + 'px',
			'height': height + 24 + 'px'
		});
	};

	window.ImageMediaItem = function(imageUrl) {
		this.imageUrl = imageUrl;
	};

	window.ImageMediaItem.prototype.attachToLightbox = function(lightbox, autoplay) {
		var self = this;

		var screenshotImg = $('<img />');
		var screenshot = new Image();
		var screenshotWrapper = $('<div class="screenshot-wrapper"></div>');

		screenshot.onload = function() {
			screenshotImg.get(0).src = screenshot.src;
			lightbox.mediaWrapper.append(screenshotWrapper);
			screenshotWrapper.append(screenshotImg);
			lightbox.attach(self);
		};

		self.setSize = function(maxImageWidth, maxImageHeight) {
			var imageWidth = screenshot.width || 480;
			var imageHeight = screenshot.height || 340;

			var finalWidth, finalHeight;

			if (
				imageWidth <= 400 && maxImageWidth >= imageWidth * 2 &&
				imageHeight <= 300 && maxImageHeight >= imageHeight * 2
			) {
				/* show image at double size */
				finalWidth = imageWidth * 2;
				finalHeight = imageHeight * 2;
			} else if (imageWidth <= maxImageWidth && imageHeight <= maxImageHeight) {
				/* show image at original size */
				finalWidth = imageWidth;
				finalHeight = imageHeight;
			} else if (imageHeight >= 4 * imageWidth && imageWidth <= maxImageWidth) {
				/* very tall image that fits within screen width; show at original size with scrollbar */
				finalWidth = imageWidth;
				finalHeight = imageHeight;
			} else if (imageHeight >= 4 * imageWidth) {
				/* very tall image that's also wider than screen width; show at full screen width with scrollbar */
				finalWidth = maxImageWidth;
				finalHeight = imageHeight * (maxImageWidth / imageWidth);
			} else if (imageWidth >= 6 * imageHeight && imageHeight <= maxImageHeight) {
				/* very wide image that fits within screen height; show at original size with scrollbar */
				finalWidth = imageWidth;
				finalHeight = imageHeight;
			} else if (imageWidth >= 6 * imageHeight) {
				/* very wide image that's also taller than screen height; show at full screen height with scrollbar */
				finalHeight = maxImageHeight;
				finalWidth = imageWidth * (maxImageHeight / imageHeight);
			} else {
				/* resize down to fit the smaller of screen width and screen height */
				var fullWidth = Math.min(imageWidth, maxImageWidth);
				var fullHeight = Math.min(imageHeight, maxImageHeight);

				var heightAtFullWidth = (fullWidth * imageHeight/imageWidth);
				var widthAtFullHeight = (fullHeight * imageWidth/imageHeight);

				if (heightAtFullWidth <= maxImageHeight) {
					finalWidth = fullWidth;
					finalHeight = Math.round(heightAtFullWidth);
				} else {
					finalWidth = Math.round(widthAtFullHeight);
					finalHeight = fullHeight;
				}
			}

			/* use pixelated style when zoomed in */
			var pixelated = (finalWidth > imageWidth);

			// finalWidth *= 2; finalHeight *= 2; /* TEMP */

			var windowWidth = Math.min(finalWidth, maxImageWidth);
			var windowHeight = Math.min(finalHeight, maxImageHeight);

			screenshotImg.attr({
				'width': finalWidth, 'height': finalHeight, 'class': (pixelated ? 'pixelated' : '')
			});
			screenshotWrapper.css({
				'width': windowWidth + 'px', 'height': windowHeight + 'px'
			});

			lightbox.setSize(windowWidth, windowHeight);
		};

		self.unload = function() {
			screenshotWrapper.remove();
		};

		screenshot.src = this.imageUrl;
	};

	$.fn.openImageInLightbox = function() {
		this.click(function(e) {
			if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
				/* probably means they want to open it in a new window, so let them... */
				return true;
			}

			var lightbox = new MediaLightbox();
			mediaItem = new ImageMediaItem(this.href);
			mediaItem.attachToLightbox(lightbox, false);

			return false;
		});
	};

	window.LightboxController = function() {
		this.lightbox = null;
		this.mediaItems = [];
		this.mediaItemsById = {};
		this.currentId = null;
		this.currentIndex = 0;
	};
	window.LightboxController.prototype.setMediaItems = function(mediaItems) {
		/* Assign a new mediaItems list to the lightbox controller. If the lightbox is
		currently open, and mediaItems contains an item with the current ID, ensure that
		currentIndex is updated to keep the lightbox at that item */
		this.mediaItems = [];
		var newMediaItemsById = {};
		var foundCurrentId = false;

		for (var i = 0; i < mediaItems.length; i++) {
			var newItem = mediaItems[i];
			/* look for an existing slide with this ID */
			var item = this.mediaItemsById[newItem.id];

			if (!item) {
				/* take the new item */
				item = newItem;
			}

			this.mediaItems[i] = item;
			newMediaItemsById[item.id] = item;

			/* if this item matches currentId, keep its place in the sequence */
			if (this.currentId == item.id) {
				foundCurrentId = true;
				this.currentIndex = i;
			}
		}
		this.mediaItemsById = newMediaItemsById;
	};
	window.LightboxController.prototype.openLightbox = function() {
		var self = this;
		if (!this.lightbox) {
			this.lightbox = new MediaLightbox();
			this.lightbox.onClose = function() {
				self.lightbox = null;
			};

			if (this.mediaItems.length > 1) {
				var navbar = $('<div class="navbar"></div>');
				this.lightbox.mediaWrapper.append(navbar);

				var prevLink = $('<a href="javascript:void(0);" class="nav prev">Previous</a>');
				prevLink.click(function() {
					self.prev();
				});
				this.lightbox.keyCodeActions[37] = function() {self.prev();}; /* action for left arrow key */
				navbar.append(prevLink);
				var nextLink = $('<a href="javascript:void(0);" class="nav next">Next</a>');
				nextLink.click(function() {
					self.next();
				});
				this.lightbox.keyCodeActions[39] = function() {self.next();}; /* action for right arrow key */
				navbar.append(nextLink);
			}

		}
	};
	window.LightboxController.prototype.prev = function() {
		this.currentIndex = (this.currentIndex + this.mediaItems.length - 1) % this.mediaItems.length;
		var item = this.mediaItems[this.currentIndex];
		this.currentId = item.id;
		this.lightbox.detach();
		item.attachToLightbox(this.lightbox, false);
		if (this.onNavigateToItem) this.onNavigateToItem(item);
	};
	window.LightboxController.prototype.next = function() {
		this.currentIndex = (this.currentIndex + 1) % this.mediaItems.length;
		var item = this.mediaItems[this.currentIndex];
		this.currentId = item.id;
		this.lightbox.detach();
		item.attachToLightbox(this.lightbox, false);
		if (this.onNavigateToItem) this.onNavigateToItem(item);
	};
	window.LightboxController.prototype.openAtId = function(id) {
		var item = this.mediaItemsById[id];
		if (item) {
			this.openLightbox();
			item.attachToLightbox(this.lightbox, true);
			this.currentId = id;
			for (var i = 0; i < this.mediaItems.length; i++) {
				if (this.mediaItems[i].id == id) {
					this.currentIndex = i;
					break;
				}
			}
		}
	};
})(jQuery);
