
/*!
  jQuery rondell plugin
  @name jquery.rondell.js
  @author Sebastian Helzle (sebastian@helzle.net or @sebobo)
  @version 0.9.1
  @date 04/09/2012
  @category jQuery plugin
  @copyright (c) 2009-2012 Sebastian Helzle (www.sebastianhelzle.net)
  @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
*/

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function($) {
    /* Global rondell plugin properties
    */
    var Rondell, RondellScrollbar;
    $.rondell = {
      version: '0.9.1',
      name: 'rondell',
      defaults: {
        showContainer: true,
        resizeableClass: 'resizeable',
        smallClass: 'itemSmall',
        hiddenClass: 'itemHidden',
        currentLayer: 0,
        container: null,
        radius: {
          x: 250,
          y: 50
        },
        center: {
          left: 340,
          top: 160
        },
        size: {
          width: null,
          height: null
        },
        visibleItems: 'auto',
        scaling: 2,
        opacityMin: 0.05,
        fadeTime: 300,
        keyDelay: 300,
        zIndex: 1000,
        itemProperties: {
          delay: 100,
          cssClass: 'rondellItem',
          size: {
            width: 150,
            height: 150
          },
          sizeFocused: {
            width: 0,
            height: 0
          }
        },
        repeating: true,
        wrapIndices: true,
        switchIndices: false,
        alwaysShowCaption: false,
        captionsEnabled: true,
        autoRotation: {
          enabled: false,
          paused: false,
          direction: 0,
          once: false,
          delay: 5000
        },
        controls: {
          enabled: true,
          fadeTime: 400,
          margin: {
            x: 130,
            y: 270
          }
        },
        strings: {
          prev: 'prev',
          next: 'next'
        },
        mousewheel: {
          enabled: true,
          threshold: 0,
          minTimeBetweenShifts: 500
        },
        touch: {
          enabled: true,
          preventDefaults: true,
          threshold: 100
        },
        randomStart: false,
        funcEase: 'easeInOutQuad',
        theme: 'default',
        preset: '',
        effect: null,
        onAfterShift: null,
        cropThumbnails: false,
        scrollbar: {
          enabled: false,
          orientation: "bottom",
          start: 1,
          end: 100,
          stepSize: 1,
          keepStepOrder: true,
          position: 1,
          padding: 10,
          style: {
            width: "100%",
            height: 20,
            left: "auto",
            right: "auto",
            top: "auto",
            bottom: "auto"
          },
          repeating: false,
          onScroll: void 0,
          scrollOnHover: false,
          scrollOnDrag: true,
          animationDuration: 300,
          easing: "easeInOutQuad"
        }
      }
    };
    /* Add default easing function for rondell to jQuery if missing
    */
    if (!$.easing.easeInOutQuad) {
      $.easing.easeInOutQuad = function(x, t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t + b;
        } else {
          return -c / 2 * ((--t) * (t - 2) - 1) + b;
        }
      };
    }
    Rondell = (function() {

      Rondell.rondellCount = 0;

      Rondell.activeRondell = null;

      function Rondell(container, options, numItems, initCallback) {
        var scrollbarContainer;
        if (initCallback == null) initCallback = void 0;
        this.keyDown = __bind(this.keyDown, this);
        this.isFocused = __bind(this.isFocused, this);
        this._autoShift = __bind(this._autoShift, this);
        this._autoShiftInit = __bind(this._autoShiftInit, this);
        this.shiftRight = __bind(this.shiftRight, this);
        this.shiftLeft = __bind(this.shiftLeft, this);
        this._refreshControls = __bind(this._refreshControls, this);
        this.getIndexInRange = __bind(this.getIndexInRange, this);
        this.getRelativeItemPosition = __bind(this.getRelativeItemPosition, this);
        this.shiftTo = __bind(this.shiftTo, this);
        this.layerFadeOut = __bind(this.layerFadeOut, this);
        this.layerFadeIn = __bind(this.layerFadeIn, this);
        this._hover = __bind(this._hover, this);
        this._onTouch = __bind(this._onTouch, this);
        this._onMousewheel = __bind(this._onMousewheel, this);
        this._start = __bind(this._start, this);
        this._loadItem = __bind(this._loadItem, this);
        this._onloadItem = __bind(this._onloadItem, this);
        this._onMouseLeaveItem = __bind(this._onMouseLeaveItem, this);
        this._onMouseEnterItem = __bind(this._onMouseEnterItem, this);
        this._initItem = __bind(this._initItem, this);
        this._getItem = __bind(this._getItem, this);
        this.hideCaption = __bind(this.hideCaption, this);
        this.showCaption = __bind(this.showCaption, this);
        this.id = Rondell.rondellCount++;
        this.items = [];
        this.maxItems = numItems;
        this.loadedItems = 0;
        this.initCallback = initCallback;
        if ((options != null ? options.preset : void 0) in $.rondell.presets) {
          $.extend(true, this, $.rondell.defaults, $.rondell.presets[options.preset], options || {});
        } else {
          $.extend(true, this, $.rondell.defaults, options || {});
        }
        $.extend(true, this, {
          _lastKeyEvent: 0,
          _focusedIndex: this.currentLayer,
          _itemIndices: {
            0: 0
          },
          autoRotation: {
            _timer: -1
          },
          controls: {
            _lastShift: 0
          },
          touch: {
            _start: void 0,
            _end: void 0
          },
          scrollbar: {
            _instance: null
          }
        });
        this.itemProperties.sizeFocused = {
          width: this.itemProperties.sizeFocused.width || this.itemProperties.size.width * this.scaling,
          height: this.itemProperties.sizeFocused.height || this.itemProperties.size.height * this.scaling
        };
        this.size = {
          width: this.size.width || this.center.left * 2,
          height: this.size.height || this.center.top * 2
        };
        this.container = container.wrapAll($("<div class=\"rondellContainer initializing rondellTheme_" + this.theme + "\"/>").css(this.size)).parent();
        if (this.showContainer) this.container.parent().show();
        if (this.scrollbar.enabled) {
          scrollbarContainer = $("<div/>");
          this.container.append(scrollbarContainer);
          $.extend(true, this.scrollbar, {
            onScroll: this.shiftTo,
            end: this.maxItems,
            position: this.currentLayer,
            repeating: this.repeating
          });
          this.scrollbar._instance = new RondellScrollbar(scrollbarContainer, this.scrollbar);
        }
      }

      Rondell.prototype.funcLeft = function(l, r, i) {
        return r.center.left - r.itemProperties.size.width / 2.0 + Math.sin(l) * r.radius.x;
      };

      Rondell.prototype.funcTop = function(l, r, i) {
        return r.center.top - r.itemProperties.size.height / 2.0 + Math.cos(l) * r.radius.y;
      };

      Rondell.prototype.funcDiff = function(d, r, i) {
        return Math.pow(Math.abs(d) / r.maxItems, 0.5) * Math.PI;
      };

      Rondell.prototype.funcOpacity = function(l, r, i) {
        if (r.visibleItems > 1) {
          return Math.max(0, 1.0 - Math.pow(l / r.visibleItems, 2));
        } else {
          return 0;
        }
      };

      Rondell.prototype.funcSize = function(l, r, i) {
        return 1;
      };

      Rondell.prototype.showCaption = function(idx) {
        var _ref;
        if (this.captionsEnabled) {
          return (_ref = this._getItem(idx).overlay) != null ? _ref.stop(true).css({
            height: 'auto',
            overflow: 'auto'
          }).fadeTo(300, 1) : void 0;
        }
      };

      Rondell.prototype.hideCaption = function(idx) {
        var overlay;
        if (this.captionsEnabled) {
          overlay = this._getItem(idx).overlay;
          return overlay != null ? overlay.filter(":visible").stop(true).css({
            height: overlay.height(),
            overflow: 'hidden'
          }).fadeTo(200, 0) : void 0;
        }
      };

      Rondell.prototype._getItem = function(layerNum) {
        return this.items[layerNum - 1];
      };

      Rondell.prototype._initItem = function(layerNum, item) {
        var caption, captionContent, _ref, _ref2, _ref3,
          _this = this;
        this.items[layerNum - 1] = item;
        item.id = layerNum;
        item.animating = false;
        this._itemIndices[layerNum] = item.currentSlot = layerNum;
        if (item.object.is("img")) {
          item.object.wrap("<div/>");
          item.object = item.object.parent();
          item.icon = $('img:first', item.object);
        }
        if (this.captionsEnabled) {
          captionContent = (_ref = item.icon) != null ? _ref.siblings() : void 0;
          if (!((captionContent != null ? captionContent.length : void 0) || item.icon) && item.object.children().length) {
            captionContent = item.object.children();
          }
          if (!(captionContent != null ? captionContent.length : void 0)) {
            caption = item.object.attr('title') || ((_ref2 = item.icon) != null ? _ref2.attr('title') : void 0) || ((_ref3 = item.icon) != null ? _ref3.attr('alt') : void 0);
            if (caption) {
              captionContent = $("<p>" + caption + "</p>");
              item.object.append(captionContent);
            }
          }
          if (captionContent != null ? captionContent.length : void 0) {
            captionContent.wrapAll($('<div class="rondellCaption"></div>'));
            if (item.icon) {
              item.overlay = $(".rondellCaption", item.object).addClass('overlay');
            }
          }
        }
        item.object.addClass("rondellItemNew " + this.itemProperties.cssClass).css({
          opacity: 0,
          width: item.sizeSmall.width,
          height: item.sizeSmall.height,
          left: this.center.left - item.sizeFocused.width / 2,
          top: this.center.top - item.sizeFocused.height / 2
        }).bind('mouseenter mouseleave click', function(e) {
          switch (e.type) {
            case 'mouseenter':
              return _this._onMouseEnterItem(item.id);
            case 'mouseleave':
              return _this._onMouseLeaveItem(item.id);
            case 'click':
              if (_this._focusedItem.id !== item.id) {
                e.preventDefault();
                if (!item.hidden && item.object.is(':visible')) {
                  return _this.shiftTo(item.currentSlot);
                }
              }
          }
        });
        this.loadedItems += 1;
        if (this.loadedItems === this.maxItems) return this._start();
      };

      Rondell.prototype._onMouseEnterItem = function(idx) {
        var item;
        item = this._getItem(idx);
        if (!item.animating && !item.hidden && item.object.is(':visible')) {
          return item.object.addClass("rondellItemHovered").stop(true).animate({
            opacity: 1
          }, this.fadeTime, this.funcEase);
        }
      };

      Rondell.prototype._onMouseLeaveItem = function(idx) {
        var item;
        item = this._getItem(idx);
        item.object.removeClass("rondellItemHovered");
        if (!item.animating && !item.hidden) {
          return item.object.stop(true).animate({
            opacity: item.lastTarget.opacity
          }, this.fadeTime, this.funcEase);
        }
      };

      Rondell.prototype._onloadItem = function(itemIndex, obj, copy) {
        var croppedSize, foHeight, foWidth, focusedSize, icon, isResizeable, itemSize, layerNum, smHeight, smWidth;
        if (copy == null) copy = void 0;
        icon = obj.is('img') ? obj : $('img:first', obj);
        isResizeable = icon.hasClass(this.resizeableClass);
        layerNum = itemIndex;
        itemSize = this.itemProperties.size;
        focusedSize = this.itemProperties.sizeFocused;
        croppedSize = itemSize;
        foWidth = smWidth = (copy != null ? copy.width() : void 0) || (copy != null ? copy[0].width : void 0) || icon[0].width || icon.width();
        foHeight = smHeight = (copy != null ? copy.height() : void 0) || (copy != null ? copy[0].height : void 0) || icon[0].height || icon.height();
        if (copy != null) copy.remove();
        if (!(smWidth && smHeight)) return;
        if (isResizeable) {
          smHeight *= itemSize.width / smWidth;
          smWidth = itemSize.width;
          if (smHeight > itemSize.height) {
            smWidth *= itemSize.height / smHeight;
            smHeight = itemSize.height;
          }
          if (this.cropThumbnails) {
            icon.wrap("<div class=\"crop\"/>");
            croppedSize = {
              width: itemSize.width,
              height: itemSize.width / smWidth * smHeight
            };
            if (croppedSize.height < itemSize.height) {
              croppedSize = {
                width: itemSize.height / croppedSize.height * croppedSize.width,
                height: itemSize.height
              };
            }
            smWidth = itemSize.width;
            smHeight = itemSize.height;
          }
          foHeight *= focusedSize.width / foWidth;
          foWidth = focusedSize.width;
          if (foHeight > focusedSize.height) {
            foWidth *= focusedSize.height / foHeight;
            foHeight = focusedSize.height;
          }
        } else {
          smWidth = itemSize.width;
          smHeight = itemSize.height;
          foWidth = focusedSize.width;
          foHeight = focusedSize.height;
        }
        return this._initItem(layerNum, {
          object: obj,
          icon: icon,
          small: false,
          hidden: false,
          resizeable: isResizeable,
          croppedSize: croppedSize,
          sizeSmall: {
            width: Math.round(smWidth),
            height: Math.round(smHeight)
          },
          sizeFocused: {
            width: Math.round(foWidth),
            height: Math.round(foHeight)
          }
        });
      };

      Rondell.prototype._loadItem = function(itemIndex, obj) {
        var copy, icon,
          _this = this;
        icon = obj.is('img') ? obj : $('img:first', obj);
        if (icon.width() > 0 || (icon[0].complete && icon[0].width > 0)) {
          return this._onloadItem(itemIndex, obj);
        } else {
          copy = $("<img style=\"display:none\"/>");
          $('body').append(copy);
          return copy.one("load", function() {
            return _this._onloadItem(itemIndex, obj, copy);
          }).attr("src", icon.attr("src"));
        }
      };

      Rondell.prototype._start = function() {
        var controls;
        if (this.randomStart) {
          this.currentLayer = Math.round(Math.random() * (this.maxItems - 1));
        } else {
          this.currentLayer = Math.max(0, Math.min(this.currentLayer || Math.round(this.maxItems / 2), this.maxItems));
        }
        if (this.visibleItems === 'auto') {
          this.visibleItems = Math.max(2, Math.floor(this.maxItems / 2));
        }
        controls = this.controls;
        if (controls.enabled) {
          this.controls._shiftLeft = $('<a class="rondellControl rondellShiftLeft" href="#"/>').text(this.strings.prev).click(this.shiftLeft).css({
            left: controls.margin.x,
            top: controls.margin.y,
            zIndex: this.zIndex + this.maxItems + 2
          });
          this.controls._shiftRight = $('<a class="rondellControl rondellShiftRight" href="#/"/>').text(this.strings.next).click(this.shiftRight).css({
            right: controls.margin.x,
            top: controls.margin.y,
            zIndex: this.zIndex + this.maxItems + 2
          });
          this.container.append(this.controls._shiftLeft, this.controls._shiftRight);
        }
        $(document).keydown(this.keyDown);
        if (this.mousewheel.enabled && ($.fn.mousewheel != null)) {
          this.container.bind('mousewheel', this._onMousewheel);
        }
        if (this._onMobile()) {
          if (this.touch.enabled) {
            this.container.bind('touchstart touchmove touchend', this._onTouch);
          }
        } else {
          this.container.bind('mouseenter mouseleave', this._hover);
        }
        this.container.removeClass("initializing");
        if (typeof this.initCallback === "function") this.initCallback(this);
        if (this._focusedItem == null) {
          this._focusedItem = this._getItem(this.currentLayer);
        }
        return this.shiftTo(this.currentLayer);
      };

      Rondell.prototype._onMobile = function() {
        /*
              Mobile device detection. 
              Check for touch functionality is currently enough.
        */        return typeof Modernizr !== "undefined" && Modernizr !== null ? Modernizr.touch : void 0;
      };

      Rondell.prototype._onMousewheel = function(e, d, dx, dy) {
        /*
              Allows rondell traveling with mousewheel.
              Requires mousewheel plugin for jQuery.
        */
        var now, selfYCenter, viewport, viewportBottom, viewportTop;
        if (!(this.mousewheel.enabled && this.isFocused())) return;
        now = (new Date()).getTime();
        if (now - this.mousewheel._lastShift < this.mousewheel.minTimeBetweenShifts) {
          return;
        }
        viewport = $(window);
        viewportTop = viewport.scrollTop();
        viewportBottom = viewportTop + viewport.height();
        selfYCenter = this.container.offset().top + this.container.outerHeight() / 2;
        if (selfYCenter > viewportTop && selfYCenter < viewportBottom && Math.abs(dx) > this.mousewheel.threshold) {
          e.preventDefault();
          if (dx < 0) {
            this.shiftLeft();
          } else {
            this.shiftRight();
          }
          return this.mousewheel._lastShift = now;
        }
      };

      Rondell.prototype._onTouch = function(e) {
        var changeX, touch;
        if (!this.touch.enabled) return;
        touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
        switch (e.type) {
          case 'touchstart':
            this.touch._start = {
              x: touch.pageX,
              y: touch.pageY
            };
            break;
          case 'touchmove':
            if (this.touch.preventDefaults) e.preventDefault();
            this.touch._end = {
              x: touch.pageX,
              y: touch.pageY
            };
            break;
          case 'touchend':
            if (this.touch._start && this.touch._end) {
              changeX = this.touch._end.x - this.touch._start.x;
              if (Math.abs(changeX) > this.touch.threshold) {
                if (changeX > 0) {
                  this.shiftLeft();
                } else if (changeX < 0) {
                  this.shiftRight();
                }
              }
              this.touch._start = this.touch._end = void 0;
            }
        }
        return true;
      };

      Rondell.prototype._hover = function(e) {
        /*
              Shows/hides rondell controls.
              Starts/pauses autorotation.
              Updates active rondell id.
        */
        var paused;
        paused = this.autoRotation.paused;
        if (e.type === 'mouseenter') {
          Rondell.activeRondell = this.id;
          this.hovering = true;
          if (!paused) {
            this.autoRotation.paused = true;
            this.showCaption(this._focusedItem.id);
          }
        } else {
          this.hovering = false;
          if (paused && !this.autoRotation.once) {
            this.autoRotation.paused = false;
            this._autoShiftInit();
          }
          if (!this.alwaysShowCaption) this.hideCaption(this._focusedItem.id);
        }
        if (this.controls.enabled) return this._refreshControls();
      };

      Rondell.prototype.layerFadeIn = function(layerNum) {
        var item, itemFocusedHeight, itemFocusedWidth, margin, newTarget,
          _this = this;
        item = this._getItem(layerNum);
        this._focusedItem = item;
        item.small = false;
        itemFocusedWidth = item.sizeFocused.width;
        itemFocusedHeight = item.sizeFocused.height;
        newTarget = {
          width: itemFocusedWidth,
          height: itemFocusedHeight,
          left: this.center.left - itemFocusedWidth / 2,
          top: this.center.top - itemFocusedHeight / 2,
          opacity: 1
        };
        item.lastTarget = newTarget;
        item.animating = true;
        item.object.stop(true).css({
          zIndex: this.zIndex + this.maxItems,
          display: "block"
        }).animate(newTarget, this.fadeTime, this.funcEase, function() {
          item.animating = false;
          item.object.addClass("rondellItemFocused");
          _this._autoShiftInit();
          if (_this.hovering || _this.alwaysShowCaption || _this._onMobile()) {
            return _this.showCaption(layerNum);
          }
        });
        if (this.cropThumbnails) {
          item.icon.stop(true).animate({
            marginTop: 0,
            marginLeft: 0,
            width: newTarget.width,
            height: newTarget.height
          }, this.fadeTime, this.funcEase);
        }
        if (item.icon && !item.resizeable) {
          margin = (this.itemProperties.sizeFocused.height - item.icon.height()) / 2;
          return item.icon.stop(true).animate({
            marginTop: margin,
            marginBottom: margin
          }, this.fadeTime);
        }
      };

      Rondell.prototype.layerFadeOut = function(layerNum) {
        var fadeTime, item, itemHeight, itemWidth, lastTarget, layerDiff, layerDist, layerPos, margin, newTarget, newZ, _ref,
          _this = this;
        item = this._getItem(layerNum);
        this.hideCaption(layerNum);
        layerNum = item.currentSlot;
        _ref = this.getRelativeItemPosition(layerNum), layerDist = _ref[0], layerPos = _ref[1];
        layerDiff = this.funcDiff(layerPos - this.currentLayer, this, layerNum);
        if (layerPos < this.currentLayer) layerDiff *= -1;
        itemWidth = item.sizeSmall.width * this.funcSize(layerDiff, this);
        itemHeight = item.sizeSmall.height * this.funcSize(layerDiff, this);
        newZ = this.zIndex - layerDist;
        fadeTime = this.fadeTime + this.itemProperties.delay * layerDist;
        newTarget = {
          width: itemWidth,
          height: itemHeight,
          left: this.funcLeft(layerDiff, this, layerNum) + (this.itemProperties.size.width - itemWidth) / 2,
          top: this.funcTop(layerDiff, this, layerNum) + (this.itemProperties.size.height - itemHeight) / 2,
          opacity: 0
        };
        if (layerDist <= this.visibleItems) {
          newTarget.opacity = this.funcOpacity(layerDiff, this, layerNum);
          lastTarget = item.lastTarget;
          if (lastTarget && lastTarget.width === newTarget.width && lastTarget.height === newTarget.height && lastTarget.left === newTarget.left && lastTarget.top === newTarget.top && lastTarget.opacity === newTarget.opacity) {
            return;
          }
          item.animating = true;
          item.hidden = false;
          item.object.removeClass("rondellItemNew rondellItemFocused").stop(true).css({
            zIndex: newZ,
            display: "block"
          }).animate(newTarget, fadeTime, this.funcEase, function() {
            item.animating = false;
            if (newTarget.opacity < _this.opacityMin) {
              item.hidden = true;
              return item.object.css("display", "none");
            } else {
              item.hidden = false;
              return item.object.css("display", "block");
            }
          });
          if (this.cropThumbnails) {
            item.icon.stop(true).animate({
              marginTop: (this.itemProperties.size.height - item.croppedSize.height) / 2,
              marginLeft: (this.itemProperties.size.width - item.croppedSize.width) / 2,
              width: item.croppedSize.width,
              height: item.croppedSize.height
            }, fadeTime, this.funcEase);
          }
          if (!item.small) {
            item.small = true;
            if (item.icon && !item.resizeable) {
              margin = (this.itemProperties.size.height - item.icon.height()) / 2;
              item.icon.stop(true).animate({
                marginTop: margin,
                marginBottom: margin
              }, fadeTime);
            }
          }
        } else if (item.hidden) {
          item.object.css(newTarget);
        } else {
          item.hidden = true;
          item.animating = true;
          item.object.stop(true).css('z-index', newZ).animate(newTarget, fadeTime / 2, this.funcEase, function() {
            return item.animating = false;
          });
        }
        return item.lastTarget = newTarget;
      };

      Rondell.prototype.shiftTo = function(idx, keepOrder) {
        var distance, i, newItem, newItemIndex, relativeIndex, scrollbarIdx, _ref, _ref2;
        if (keepOrder == null) keepOrder = false;
        if (idx == null) return;
        if (!keepOrder && this.switchIndices && idx !== this.currentLayer && this.getIndexInRange(idx) === this._focusedItem.currentSlot) {
          _ref = this.getRelativeItemPosition(idx, true), distance = _ref[0], relativeIndex = _ref[1];
          if (relativeIndex > this.currentLayer) {
            idx++;
          } else {
            idx--;
          }
        }
        idx = this.getIndexInRange(idx);
        newItemIndex = this._itemIndices[idx];
        if (this.switchIndices) {
          newItem = this._getItem(newItemIndex);
          this._itemIndices[idx] = this._focusedItem.id;
          this._itemIndices[this._focusedItem.currentSlot] = newItemIndex;
          newItem.currentSlot = this._focusedItem.currentSlot;
          this._focusedItem.currentSlot = idx;
          this._focusedItem = newItem;
        }
        this.currentLayer = idx;
        for (i = 1, _ref2 = this.maxItems; 1 <= _ref2 ? i <= _ref2 : i >= _ref2; 1 <= _ref2 ? i++ : i--) {
          if (i !== newItemIndex) this.layerFadeOut(i);
        }
        this.layerFadeIn(newItemIndex);
        this._refreshControls();
        if (typeof this.onAfterShift === "function") this.onAfterShift(idx);
        if (this.scrollbar.enabled) {
          scrollbarIdx = idx;
          if (idx === this._focusedItem.currentSlot) {
            scrollbarIdx = this._focusedItem.currentSlot + 1;
          }
          return this.scrollbar._instance.setPosition(scrollbarIdx, false);
        }
      };

      Rondell.prototype.getRelativeItemPosition = function(idx, wrapIndices) {
        var distance, relativeIndex;
        if (wrapIndices == null) wrapIndices = this.wrapIndices;
        distance = Math.abs(idx - this.currentLayer);
        relativeIndex = idx;
        if (distance > this.visibleItems && distance > this.maxItems / 2 && this.repeating && wrapIndices) {
          if (idx > this.currentLayer) {
            relativeIndex -= this.maxItems;
          } else {
            relativeIndex += this.maxItems;
          }
          distance = Math.abs(relativeIndex - this.currentLayer);
        }
        return [distance, relativeIndex];
      };

      Rondell.prototype.getIndexInRange = function(idx) {
        if (this.repeating) {
          if (idx < 1) {
            idx += this.maxItems;
          } else if (idx > this.maxItems) {
            idx -= this.maxItems;
          }
        } else {
          if (idx < 1) {
            idx = 1;
          } else if (idx > this.maxItems) {
            idx = this.maxItems;
          }
        }
        return idx;
      };

      Rondell.prototype._refreshControls = function() {
        if (!this.controls.enabled) return;
        this.controls._shiftLeft.stop().fadeTo(this.controls.fadeTime, (this.currentLayer > 1 || this.repeating) && this.hovering ? 1 : 0);
        return this.controls._shiftRight.stop().fadeTo(this.controls.fadeTime, (this.currentLayer < this.maxItems || this.repeating) && this.hovering ? 1 : 0);
      };

      Rondell.prototype.shiftLeft = function(e) {
        if (e != null) e.preventDefault();
        return this.shiftTo(this.currentLayer - 1);
      };

      Rondell.prototype.shiftRight = function(e) {
        if (e != null) e.preventDefault();
        return this.shiftTo(this.currentLayer + 1);
      };

      Rondell.prototype._autoShiftInit = function() {
        var autoRotation;
        autoRotation = this.autoRotation;
        if (this.isActive() && autoRotation.enabled && autoRotation._timer < 0) {
          return autoRotation._timer = window.setTimeout(this._autoShift, autoRotation.delay);
        }
      };

      Rondell.prototype._autoShift = function() {
        this.autoRotation._timer = -1;
        if (this.isActive() && this.isFocused() && !this.autoRotation.paused) {
          if (this.autoRotation.direction) {
            return this.shiftRight();
          } else {
            return this.shiftLeft();
          }
        } else {
          return this._autoShiftInit();
        }
      };

      Rondell.prototype.isActive = function() {
        return true;
      };

      Rondell.prototype.isFocused = function() {
        return Rondell.activeRondell === this.id;
      };

      Rondell.prototype.keyDown = function(e) {
        var now;
        if (!(this.isActive() && this.isFocused())) return;
        now = (new Date()).getTime();
        if (this._lastKeyEvent > now - this.keyDelay) return;
        if (this.autoRotation._timer >= 0) {
          window.clearTimeout(this.autoRotation._timer);
          this.autoRotation._timer = -1;
        }
        this._lastKeyEvent = now;
        switch (e.which) {
          case 37:
            return this.shiftLeft(e);
          case 39:
            return this.shiftRight(e);
        }
      };

      return Rondell;

    })();
    RondellScrollbar = (function() {

      function RondellScrollbar(container, options) {
        this.scrollRight = __bind(this.scrollRight, this);
        this.scrollLeft = __bind(this.scrollLeft, this);
        this.onControlEvent = __bind(this.onControlEvent, this);
        this.onWindowEvent = __bind(this.onWindowEvent, this);
        this.setPosition = __bind(this.setPosition, this);
        this.scrollTo = __bind(this.scrollTo, this);
        this.updatePosition = __bind(this.updatePosition, this);
        this._initControls = __bind(this._initControls, this);        this.container = container.addClass("rondell-scrollbar");
        $.extend(true, this, $.rondell.defaults.scrollbar, options);
        this._drag = {
          _dragging: false,
          _lastDragEvent: 0
        };
        this.container.addClass("rondell-scrollbar-" + this.orientation).css(this.style);
        this._initControls();
        this._minX = this.padding + this.scrollLeftControl.outerWidth() + this.scrollControl.outerWidth() / 2;
        this._maxX = this.container.innerWidth() - this.padding - this.scrollRightControl.outerWidth() - this.scrollControl.outerWidth() / 2;
        this.setPosition(this.position, false, true);
      }

      RondellScrollbar.prototype._initControls = function() {
        this.scrollLeftControl = $("<div class=\"rondell-scrollbar-left\"><span class=\"rondell-scrollbar-inner\">&nbsp;</span></div>").bind("click", this.scrollLeft);
        this.scrollRightControl = $("<div class=\"rondell-scrollbar-right\"><span class=\"rondell-scrollbar-inner\">&nbsp;</span></div>").bind("click", this.scrollRight);
        this.scrollControl = $("<div class=\"rondell-scrollbar-control\">&nbsp;</div>").css({
          left: this.container.innerWidth() / 2
        });
        this.scrollBackground = $("<div class=\"rondell-scrollbar-background\"/>");
        this.container.bind("mousedown click", this.onControlEvent);
        $(window).bind("mousemove mouseup", this.onWindowEvent);
        return this.container.append(this.scrollBackground, this.scrollLeftControl, this.scrollRightControl, this.scrollControl);
      };

      RondellScrollbar.prototype.updatePosition = function(position, fireCallback) {
        if (fireCallback == null) fireCallback = true;
        if (!position || position === this.position || position < this.start || position > this.end) {
          return;
        }
        this.position = position;
        if (fireCallback) {
          return typeof this.onScroll === "function" ? this.onScroll(position, true) : void 0;
        }
      };

      RondellScrollbar.prototype.scrollTo = function(x, animate, fireCallback) {
        var newPosition, scroller, target;
        if (animate == null) animate = true;
        if (fireCallback == null) fireCallback = true;
        if (x < this._minX || x > this._maxX) return;
        scroller = this.scrollControl.stop(true);
        target = {
          left: x
        };
        if (animate) {
          scroller.animate(target, this.animationDuration, this.easing);
        } else {
          scroller.css(target);
        }
        newPosition = Math.round((x - this._minX) / (this._maxX - this._minX) * (this.end - this.start)) + this.start;
        if (newPosition !== this.position) {
          return this.updatePosition(newPosition, fireCallback);
        }
      };

      RondellScrollbar.prototype.setPosition = function(position, fireCallback, force) {
        var newX;
        if (fireCallback == null) fireCallback = true;
        if (force == null) force = false;
        if (this.repeating) {
          if (position < this.start) position = this.end;
          if (position > this.end) position = this.start;
        }
        if (!force && (position < this.start || position > this.end || position === this.position)) {
          return;
        }
        newX = Math.round((position - this.start) / (this.end - this.start) * (this._maxX - this._minX)) + this._minX;
        return this.scrollTo(newX, true, fireCallback);
      };

      RondellScrollbar.prototype.onWindowEvent = function(e) {
        var newX;
        if (!this._drag._dragging) return;
        if (e.type === "mouseup") {
          this._drag._dragging = false;
          return this.scrollControl.removeClass("rondell-scrollbar-dragging");
        } else if (e.type === "mousemove") {
          newX = 0;
          if (this.orientation === "top" || this.orientation === "bottom") {
            newX = e.pageX - this.container.offset().left;
          } else {
            newX = e.pageY - this.container.offset().top;
          }
          newX = Math.max(this._minX, Math.min(this._maxX, newX));
          return this.scrollTo(newX, false);
        }
      };

      RondellScrollbar.prototype.onControlEvent = function(e) {
        var clickTarget;
        e.preventDefault();
        if (e.type === "mousedown" && e.target === this.scrollControl[0]) {
          this._drag._dragging = true;
          return this.scrollControl.addClass("rondell-scrollbar-dragging");
        } else if (e.type === "click" && (e.target === this.scrollBackground[0] || e.target === this.container[0])) {
          clickTarget = e.pageX - this.container.offset().left;
          this.scrollTo(clickTarget);
          return false;
        }
      };

      RondellScrollbar.prototype.scrollLeft = function(e) {
        var newPosition;
        e.preventDefault();
        newPosition = this.position - this.stepSize;
        if (this.keepStepOrder && this.stepSize > 1) {
          if (newPosition >= this.start) {
            newPosition -= (newPosition - this.start) % this.stepSize;
          } else if (this.repeating) {
            newPosition = this.start + Math.floor((this.end - this.start) / this.stepSize) * this.stepSize;
          }
        }
        return this.setPosition(newPosition);
      };

      RondellScrollbar.prototype.scrollRight = function(e) {
        var newPosition;
        e.preventDefault();
        newPosition = this.position + this.stepSize;
        if (this.keepStepOrder && this.stepSize > 1) {
          newPosition -= (newPosition - this.start) % this.stepSize;
          if (this.repeating && newPosition > this.end) newPosition = this.start;
        }
        return this.setPosition(newPosition);
      };

      return RondellScrollbar;

    })();
    return $.fn.rondell = function(options, callback) {
      var rondell;
      if (options == null) options = {};
      if (callback == null) callback = void 0;
      rondell = new Rondell(this, options, this.length, callback);
      this.each(function(idx) {
        var itemIndex, obj;
        obj = $(this);
        itemIndex = idx + 1;
        if (obj.is('img') || $('img:first', obj).length) {
          return rondell._loadItem(itemIndex, obj);
        } else {
          return rondell._initItem(itemIndex, {
            object: obj,
            icon: null,
            small: false,
            hidden: false,
            resizeable: false,
            sizeSmall: rondell.itemProperties.size,
            sizeFocused: rondell.itemProperties.sizeFocused
          });
        }
      });
      return rondell;
    };
  })(jQuery);

  /*!
    Presets for jQuery rondell plugin
    
    @author Sebastian Helzle (sebastian@helzle.net or @sebobo)
    @category jQuery plugin
    @copyright (c) 2009-2011 Sebastian Helzle (www.sebastianhelzle.net)
    @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
  */

  (function($) {
    $.rondell = $.rondell || {};
    return $.rondell.presets = {
      carousel: {
        autoRotation: {
          enabled: true,
          direction: 1,
          once: false,
          delay: 5000
        },
        radius: {
          x: 240
        },
        center: {
          left: 340,
          top: 160
        },
        controls: {
          margin: {
            x: 130,
            y: 260
          }
        },
        randomStart: true,
        currentLayer: 1,
        funcSize: function(layerDiff, rondell) {
          return (rondell.maxItems / Math.abs(layerDiff)) / rondell.maxItems;
        }
      },
      products: {
        repeating: false,
        alwaysShowCaption: true,
        visibleItems: 4,
        theme: "dark",
        itemProperties: {
          delay: 0,
          size: {
            width: 100,
            height: 200
          },
          sizeFocused: {
            width: 300,
            height: 200
          }
        },
        center: {
          left: 400,
          top: 100
        },
        size: {
          width: 800,
          height: 200
        },
        controls: {
          margin: {
            x: 210,
            y: 158
          }
        },
        funcTop: function(l, r, i) {
          return 0;
        },
        funcDiff: function(d, r, i) {
          return Math.abs(d) + 1;
        },
        funcLeft: function(l, r, i) {
          return r.center.left + (l - 0.5) * r.itemProperties.size.width;
        },
        funcOpacity: function(l, r, i) {
          return 0.8;
        }
      },
      pages: {
        radius: {
          x: 0,
          y: 0
        },
        scaling: 1,
        theme: "page",
        visibleItems: 1,
        controls: {
          margin: {
            x: 0,
            y: 0
          }
        },
        strings: {
          prev: ' ',
          next: ' '
        },
        center: {
          left: 200,
          top: 200
        },
        itemProperties: {
          size: {
            width: 400,
            height: 400
          }
        },
        funcTop: function(layerDiff, rondell) {
          return rondell.center.top - rondell.itemProperties.size.height / 2;
        },
        funcLeft: function(layerDiff, rondell) {
          return rondell.center.left + layerDiff * rondell.itemProperties.size.width;
        },
        funcDiff: function(layerDiff, rondell) {
          return Math.abs(layerDiff) + 0.5;
        }
      },
      cubic: {
        center: {
          left: 300,
          top: 200
        },
        visibleItems: 5,
        itemProperties: {
          size: {
            width: 350,
            height: 350
          },
          sizeFocused: {
            width: 350,
            height: 350
          }
        },
        controls: {
          margin: {
            x: 70,
            y: 330
          }
        },
        funcTop: function(layerDiff, rondell) {
          return rondell.center.top - rondell.itemProperties.size.height / 2 + Math.pow(layerDiff / 2, 3) * rondell.radius.x;
        },
        funcLeft: function(layerDiff, rondell) {
          return rondell.center.left - rondell.itemProperties.size.width / 2 + Math.sin(layerDiff) * rondell.radius.x;
        },
        funcSize: function(layerDiff, rondell) {
          return Math.pow((Math.PI - Math.abs(layerDiff)) / Math.PI, 3);
        }
      },
      gallery: {
        special: {
          itemPadding: 2
        },
        visibleItems: 5,
        theme: "dark",
        cropThumbnails: true,
        center: {
          top: 145,
          left: 250
        },
        size: {
          height: 400,
          width: 500
        },
        controls: {
          margin: {
            x: 10,
            y: 255
          }
        },
        itemProperties: {
          delay: 0,
          sizeFocused: {
            width: 480,
            height: 280
          },
          size: {
            width: 80,
            height: 100
          }
        },
        funcTop: function(l, r, i) {
          return r.size.height - r.itemProperties.size.height - r.special.itemPadding;
        },
        funcDiff: function(d, r, i) {
          return Math.abs(d) - 0.5;
        },
        funcLeft: function(l, r, i) {
          return r.center.left + (l - 0.5) * (r.itemProperties.size.width + r.special.itemPadding);
        },
        funcOpacity: function(l, r, i) {
          return 0.8;
        }
      },
      thumbGallery: {
        special: {
          columns: 3,
          rows: 3,
          groupSize: 9,
          itemPadding: 5,
          thumbsOffset: {
            x: 500,
            y: 0
          }
        },
        visibleItems: 9,
        wrapIndices: false,
        currentLayer: 1,
        switchIndices: true,
        cropThumbnails: true,
        center: {
          top: 215,
          left: 250
        },
        size: {
          height: 430,
          width: 800
        },
        controls: {
          enabled: false,
          margin: {
            x: 10,
            y: 255
          }
        },
        itemProperties: {
          delay: 40,
          sizeFocused: {
            width: 480,
            height: 420
          },
          size: {
            width: 94,
            height: 126
          }
        },
        scrollbar: {
          enabled: true,
          stepSize: 9,
          start: 2,
          style: {
            width: 292,
            right: 3,
            bottom: 5
          }
        },
        funcDiff: function(d, r, i) {
          return Math.abs(d);
        },
        funcOpacity: function(l, r, i) {
          var currentLayerIndex;
          currentLayerIndex = r.currentLayer > r._focusedItem.currentSlot ? r.currentLayer - 1 : r.currentLayer;
          if (i > r._focusedItem.currentSlot) i--;
          if (Math.floor((i - 1) / r.special.groupSize) === Math.floor((currentLayerIndex - 1) / r.special.groupSize)) {
            return 0.8;
          } else {
            return 0;
          }
        },
        funcTop: function(l, r, i) {
          if (i > r._focusedItem.currentSlot) i--;
          return r.special.thumbsOffset.y + r.special.itemPadding + Math.floor(((i - 1) % r.special.groupSize) / r.special.rows) * (r.itemProperties.size.height + r.special.itemPadding);
        },
        funcLeft: function(l, r, i) {
          var column, currentLayerIndex, groupOffset;
          currentLayerIndex = r.currentLayer > r._focusedItem.currentSlot ? r.currentLayer - 1 : r.currentLayer;
          if (i > r._focusedItem.currentSlot) i--;
          column = ((i - 1) % r.special.groupSize) % r.special.columns;
          groupOffset = Math.floor((i - 1) / r.special.groupSize) - Math.floor((currentLayerIndex - 1) / r.special.groupSize);
          return r.special.thumbsOffset.x + r.special.itemPadding + (column + r.special.columns * groupOffset) * (r.itemProperties.size.width + r.special.itemPadding);
        }
      },
      slider: {
        theme: 'slider',
        visibleItems: 1,
        fadeTime: 1000,
        opacityMin: 0.01,
        autoRotation: {
          enabled: true
        },
        center: {
          top: 150,
          left: 300
        },
        size: {
          height: 300,
          width: 600
        },
        controls: {
          margin: {
            x: -1,
            y: 135
          }
        },
        itemProperties: {
          sizeFocused: {
            width: 600,
            height: 300
          },
          size: {
            width: 600,
            height: 300
          }
        },
        funcTop: function(layerDiff, rondell) {
          return 0;
        },
        funcLeft: function(layerDiff, rondell) {
          return 0;
        },
        funcOpacity: function(layerDist, rondell) {
          return 0.02;
        }
      }
    };
  })(jQuery);

}).call(this);
