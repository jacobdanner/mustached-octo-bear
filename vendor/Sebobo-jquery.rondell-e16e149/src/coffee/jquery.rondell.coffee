###!
  jQuery rondell plugin
  @name jquery.rondell.js
  @author Sebastian Helzle (sebastian@helzle.net or @sebobo)
  @version 0.9.1
  @date 04/09/2012
  @category jQuery plugin
  @copyright (c) 2009-2012 Sebastian Helzle (www.sebastianhelzle.net)
  @license Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
###

(($) ->
  ### Global rondell plugin properties ###
  $.rondell =
    version: '0.9.1'
    name: 'rondell'
    defaults:
      showContainer: true       # When the plugin has finished initializing $.show() will be called on the items container
      resizeableClass: 'resizeable'
      smallClass: 'itemSmall'
      hiddenClass: 'itemHidden'
      currentLayer: 0           # Active layer number in a rondell instance
      container: null           # Container object wrapping the rondell items
      radius:                   # Radius for the default circle function
        x: 250 
        y: 50  
      center:                   # Center where the focused element is displayed
        left: 340 
        top: 160
      size:                     # Defaults to center * 2 on init
        width: null
        height: null
      visibleItems: 'auto'      # How many items should be visible in each direction
      scaling: 2                # Size of focused element
      opacityMin: 0.05          # Min opacity before elements are set to display: none
      fadeTime: 300
      keyDelay: 300             # Min time between key strokes are registered
      zIndex: 1000              # All elements of the rondell will use this z-index and add their depth to it
      itemProperties:           # Default properties for each item
        delay: 100              # Time offset between the animation of each item
        cssClass: 'rondellItem' # Identifier for each item
        size: 
          width: 150
          height: 150
        sizeFocused:
          width: 0
          height: 0
      repeating: true           # Will show first item after last item and so on
      wrapIndices: true         # Will modify relative item indices to fix positioning when repeating
      switchIndices: false      # After a shift the last focused item and the new one will switch indices
      alwaysShowCaption: false  # Don't hide caption on mouseleave
      captionsEnabled: true
      autoRotation:             # If the cursor leaves the rondell continue spinning
        enabled: false
        paused: false           # Can be used to pause the auto rotation with a play/pause button for example 
        direction: 0            # 0 or 1 means left and right
        once: false             # Will animate until the rondell will be hovered at least once
        delay: 5000
      controls:                 # Buttons to control the rondell
        enabled: true
        fadeTime: 400           # Show/hide animation speed
        margin:     
          x: 130                 # Distance from left and right edge of the container
          y: 270                 # Distance from top and bottom edge of the container
      strings: # String for the controls 
        prev: 'prev'
        next: 'next'
      mousewheel:
        enabled: true
        threshold: 0
        minTimeBetweenShifts: 500
      touch:
        enabled: true
        preventDefaults: true   # Will call event.preventDefault() on touch events
        threshold: 100          # Distance in pixels the "finger" has to swipe to create the touch event      
      randomStart: false
      funcEase: 'easeInOutQuad' # jQuery easing function name for the movement of items
      theme: 'default'          # CSS theme class which gets added to the rondell container
      preset: ''                # Configuration preset
      effect: null              # Special effect function for the focused item, not used currently
      onAfterShift: null
      cropThumbnails: false     
      scrollbar:
        enabled: false
        orientation: "bottom"
        start: 1
        end: 100
        stepSize: 1
        keepStepOrder: true
        position: 1
        padding: 10
        style:
          width: "100%"
          height: 20
          left: "auto"
          right: "auto"
          top: "auto"
          bottom: "auto"
        repeating: false
        onScroll: undefined
        scrollOnHover: false
        scrollOnDrag: true
        animationDuration: 300
        easing: "easeInOutQuad"
  
  ### Add default easing function for rondell to jQuery if missing ###
  unless $.easing.easeInOutQuad        
    $.easing.easeInOutQuad = (x, t, b, c, d) ->
      if ((t/=d/2) < 1) then c/2*t*t + b else -c/2 * ((--t)*(t-2) - 1) + b
   
  # Rondell class holds all rondell items and functions   
  class Rondell
    @rondellCount: 0            # Globally stores the number of rondells for uuid creation
    @activeRondell: null        # Globally stores the last activated rondell for keyboard interaction
    
    constructor: (container, options, numItems, initCallback=undefined) ->
      @id = Rondell.rondellCount++
      @items = [] # Holds the items
      @maxItems = numItems
      @loadedItems = 0
      @initCallback = initCallback

      # Update rondell properties with new options
      if options?.preset of $.rondell.presets
        $.extend(true, @, $.rondell.defaults, $.rondell.presets[options.preset], options or {})
      else
        $.extend(true, @, $.rondell.defaults, options or {})

      # Init some private variables
      $.extend true, @,
        _lastKeyEvent: 0
        _focusedIndex: @currentLayer
        _itemIndices: { 0: 0 }
        autoRotation:
          _timer: -1              
        controls:
          _lastShift: 0
        touch:
          _start: undefined        
          _end: undefined  
        scrollbar:
          _instance: null 
        
      # Compute focused item size if not set
      @itemProperties.sizeFocused =
        width: @itemProperties.sizeFocused.width or @itemProperties.size.width * @scaling
        height: @itemProperties.sizeFocused.height or @itemProperties.size.height * @scaling
      
      # Compute size if not set  
      @size = 
        width: @size.width or @center.left * 2
        height: @size.height or @center.top * 2

      # Wrap elements in new container
      @container = container.wrapAll($("<div class=\"rondellContainer initializing rondellTheme_#{@theme}\"/>").css(@size)).parent()
      
      # Show items hidden parent container to prevent graphical glitch
      @container.parent().show() if @showContainer

      # Create scrollbar
      if @scrollbar.enabled
        scrollbarContainer = $ "<div/>"
        @container.append scrollbarContainer

        $.extend true, @scrollbar,
          onScroll: @shiftTo
          end: @maxItems
          position: @currentLayer
          repeating: @repeating

        @scrollbar._instance = new RondellScrollbar(scrollbarContainer, @scrollbar)
    
    # Animation functions, can be different for each rondell
    funcLeft: (l, r, i) ->
      r.center.left - r.itemProperties.size.width / 2.0 + Math.sin(l) * r.radius.x
    funcTop: (l, r, i) ->
      r.center.top - r.itemProperties.size.height / 2.0 + Math.cos(l) * r.radius.y
    funcDiff: (d, r, i) ->
      Math.pow(Math.abs(d) / r.maxItems, 0.5) * Math.PI
    funcOpacity: (l, r, i) ->
      if r.visibleItems > 1 then Math.max(0, 1.0 - Math.pow(l / r.visibleItems, 2)) else 0
    funcSize: (l, r, i) ->
      1
    
    showCaption: (idx) => 
      if @captionsEnabled
        # Restore automatic height and show caption
        @_getItem(idx).overlay?.stop(true).css
          height: 'auto'
          overflow: 'auto'
        .fadeTo 300, 1
      
    hideCaption: (idx) =>
      if @captionsEnabled
        # Fix height before hiding the caption to avoid jumping text when the item changes its size
        overlay = @_getItem(idx).overlay
        overlay?.filter(":visible").stop(true).css
          height: overlay.height()
          overflow: 'hidden'
        .fadeTo 200, 0
      
    _getItem: (layerNum) =>
      @items[layerNum - 1]
      
    _initItem: (layerNum, item) =>
      @items[layerNum - 1] = item

      # Add some private variables
      item.id = layerNum
      item.animating = false
      @_itemIndices[layerNum] = item.currentSlot = layerNum

      # If item is an img tag, wrap with div
      if item.object.is "img"
        item.object.wrap "<div/>"
        item.object = item.object.parent()
        item.icon = $ 'img:first', item.object
      
      if @captionsEnabled
        # Wrap other content as overlay caption
        captionContent = item.icon?.siblings()
        if not (captionContent?.length or item.icon) and item.object.children().length
          captionContent = item.object.children()
          
        # Or use title/alt texts as overlay caption
        unless captionContent?.length 
          caption = item.object.attr('title') or item.icon?.attr('title') or item.icon?.attr('alt')  
          if caption
            captionContent = $ "<p>#{caption}</p>"
            item.object.append captionContent

        # Create overlay from caption if found
        if captionContent?.length
          captionContent.wrapAll $('<div class="rondellCaption"></div>')

          if item.icon
            item.overlay = $(".rondellCaption", item.object).addClass('overlay') 

      # Init click events
      item.object
      .addClass("rondellItemNew #{@itemProperties.cssClass}")
      .css
        opacity: 0
        width: item.sizeSmall.width
        height: item.sizeSmall.height
        left: @center.left - item.sizeFocused.width / 2
        top: @center.top - item.sizeFocused.height / 2
      .bind 'mouseenter mouseleave click', (e) =>
        switch e.type
          when 'mouseenter' then @_onMouseEnterItem item.id
          when 'mouseleave' then @_onMouseLeaveItem item.id
          when 'click'
            if @_focusedItem.id isnt item.id
              e.preventDefault() 
              if not item.hidden and item.object.is(':visible')
                @shiftTo item.currentSlot
      
      @loadedItems += 1
      
      @_start() if @loadedItems is @maxItems

    _onMouseEnterItem: (idx) =>
      item = @_getItem idx
      if not item.animating and not item.hidden and item.object.is(':visible')
        item.object.addClass("rondellItemHovered").stop(true).animate
            opacity: 1
          , @fadeTime, @funcEase

    _onMouseLeaveItem: (idx) =>
      item = @_getItem idx
      item.object.removeClass "rondellItemHovered"

      if not item.animating and not item.hidden
        item.object.stop(true).animate
            opacity: item.lastTarget.opacity
          , @fadeTime, @funcEase
      
    _onloadItem: (itemIndex, obj, copy=undefined) =>
      icon = if obj.is('img') then obj else $('img:first', obj)
      
      isResizeable = icon.hasClass @resizeableClass
      layerNum = itemIndex
    
      itemSize = @itemProperties.size
      focusedSize = @itemProperties.sizeFocused
      croppedSize = itemSize
      
      # create size vars for the small and focused size
      foWidth = smWidth = copy?.width() or copy?[0].width or icon[0].width or icon.width()
      foHeight = smHeight = copy?.height() or copy?[0].height or icon[0].height or icon.height()
      
      # Delete copy, not needed anymore
      copy?.remove()
      
      # Return if width and height can't be resolved
      return unless smWidth and smHeight
    
      if isResizeable
        # Fit to small width
        smHeight *= itemSize.width / smWidth
        smWidth = itemSize.width
          
        # Fit to small height
        if smHeight > itemSize.height
          smWidth *= itemSize.height / smHeight
          smHeight = itemSize.height

        # Cropping will fill the thumbnail size in both dimensions
        if @cropThumbnails
          icon.wrap "<div class=\"crop\"/>"
          croppedSize =
            width: itemSize.width
            height: itemSize.width / smWidth * smHeight
          if croppedSize.height < itemSize.height
            croppedSize =
              width: itemSize.height / croppedSize.height * croppedSize.width
              height: itemSize.height

          smWidth = itemSize.width
          smHeight = itemSize.height
        
        # fit to focused width
        foHeight *= focusedSize.width / foWidth
        foWidth = focusedSize.width
        
        # fit to focused height
        if foHeight > focusedSize.height
          foWidth *= focusedSize.height / foHeight
          foHeight = focusedSize.height
      else
        # scale to given sizes
        smWidth = itemSize.width
        smHeight = itemSize.height
        foWidth = focusedSize.width
        foHeight = focusedSize.height
        
      # Set vars in item array
      @_initItem layerNum, 
        object: obj 
        icon: icon
        small: false 
        hidden: false
        resizeable: isResizeable
        croppedSize: croppedSize
        sizeSmall: 
          width: Math.round smWidth
          height: Math.round smHeight
        sizeFocused: 
          width: Math.round foWidth
          height: Math.round foHeight
      
    _loadItem: (itemIndex, obj) =>
      icon = if obj.is('img') then obj else $('img:first', obj)

      if icon.width() > 0 or (icon[0].complete and icon[0].width > 0)
        # Image is already loaded (i.e. from cache)
        @_onloadItem itemIndex, obj
      else 
        # Create copy of the image and wait for the copy to load to get the real dimensions
        copy = $("<img style=\"display:none\"/>")
        $('body').append(copy)
        copy.one("load", =>
          @_onloadItem(itemIndex, obj, copy)
        ).attr("src", icon.attr("src"))
      
    _start: =>
      # Set currentlayer to the middle item or leave it be if set before and index exists
      if @randomStart
        @currentLayer = Math.round(Math.random() * (@maxItems - 1))
      else
        @currentLayer = Math.max(0, Math.min(@currentLayer or Math.round(@maxItems / 2), @maxItems))
      
      # Set visibleItems to half the maxItems if set to auto
      @visibleItems = Math.max(2, Math.floor(@maxItems / 2)) if @visibleItems is 'auto'
      
      # Create controls
      controls = @controls
      if controls.enabled
        @controls._shiftLeft = $('<a class="rondellControl rondellShiftLeft" href="#"/>').text(@strings.prev).click(@shiftLeft)
        .css
          left: controls.margin.x
          top: controls.margin.y
          zIndex: @zIndex + @maxItems + 2
          
        @controls._shiftRight = $('<a class="rondellControl rondellShiftRight" href="#/"/>').text(@strings.next).click(@shiftRight)
        .css
          right: controls.margin.x
          top: controls.margin.y
          zIndex: @zIndex + @maxItems + 2
          
        @container.append @controls._shiftLeft, @controls._shiftRight
        
      # Attach keydown event to document for each rondell instance
      $(document).keydown @keyDown
        
      # Enable rondell traveling with mousewheel if plugin is available
      @container.bind('mousewheel', @_onMousewheel) if @mousewheel.enabled and $.fn.mousewheel?
      
      # Use modernizr feature detection to enable touch device support
      if @_onMobile()
        # Enable swiping
        @container.bind('touchstart touchmove touchend', @_onTouch) if @touch.enabled
      else
        # Add hover and touch functions to container when we don't have touch support
        @container.bind('mouseenter mouseleave', @_hover)
        
      @container.removeClass "initializing"
          
      # Fire callback after initialization with rondell instance if callback was provided
      @initCallback?(@)
      
      # Move items to starting positions
      @_focusedItem ?= @_getItem @currentLayer
      @shiftTo @currentLayer
      
    _onMobile: ->
      ###
      Mobile device detection. 
      Check for touch functionality is currently enough.
      ###
      return Modernizr?.touch
      
    _onMousewheel: (e, d, dx, dy) =>
      ###
      Allows rondell traveling with mousewheel.
      Requires mousewheel plugin for jQuery. 
      ###
      return unless (@mousewheel.enabled and @isFocused())

      now = (new Date()).getTime()
      return if now - @mousewheel._lastShift < @mousewheel.minTimeBetweenShifts
      
      viewport = $ window
      viewportTop = viewport.scrollTop()
      viewportBottom = viewportTop + viewport.height()
      
      selfYCenter = @container.offset().top + @container.outerHeight() / 2
      
      if selfYCenter > viewportTop and selfYCenter < viewportBottom and Math.abs(dx) > @mousewheel.threshold
        e.preventDefault()
        if dx < 0 then @shiftLeft() else @shiftRight()
        @mousewheel._lastShift = now

    _onTouch: (e) =>
      return unless @touch.enabled
      
      touch = e.originalEvent.touches[0] or e.originalEvent.changedTouches[0]
      
      switch e.type
        when 'touchstart'
          @touch._start = 
            x: touch.pageX
            y: touch.pageY
        when 'touchmove'
          e.preventDefault() if @touch.preventDefaults
          @touch._end =
            x: touch.pageX
            y: touch.pageY
        when 'touchend'
          if @touch._start and @touch._end
            # Check if delta x is greater than our threshold for swipe detection
            changeX = @touch._end.x - @touch._start.x
            if Math.abs(changeX) > @touch.threshold
              if changeX > 0
                @shiftLeft()
              else if changeX < 0
                @shiftRight()
              
            # Reset end position
            @touch._start = @touch._end = undefined
            
      true
      
    _hover: (e) =>
      ###
      Shows/hides rondell controls.
      Starts/pauses autorotation.
      Updates active rondell id.
      ###
      
      # Start or stop auto rotation if enabled
      paused = @autoRotation.paused
      if e.type is 'mouseenter'
        # Set active rondell id if hovered
        Rondell.activeRondell = @id
        
        @hovering = true
        unless paused
          @autoRotation.paused = true
          @showCaption(@_focusedItem.id)
      else
        @hovering = false
        if paused and not @autoRotation.once
          @autoRotation.paused = false
          @_autoShiftInit()
        @hideCaption(@_focusedItem.id) unless @alwaysShowCaption
            
      # Show or hide controls if they exist
      @_refreshControls() if @controls.enabled
      
    layerFadeIn: (layerNum) =>
      item = @_getItem(layerNum)
      @_focusedItem = item

      item.small = false
      itemFocusedWidth = item.sizeFocused.width
      itemFocusedHeight = item.sizeFocused.height

      newTarget =
        width: itemFocusedWidth
        height: itemFocusedHeight
        left: @center.left - itemFocusedWidth / 2
        top: @center.top - itemFocusedHeight / 2
        opacity: 1
      item.lastTarget = newTarget
      item.animating = true
      
      # Move item to center position and fade in
      item.object.stop(true)
      .css
        zIndex: @zIndex + @maxItems
        display: "block"
      .animate newTarget, @fadeTime, @funcEase, =>
        item.animating = false
        item.object.addClass "rondellItemFocused"
        @_autoShiftInit()
        @showCaption(layerNum) if @hovering or @alwaysShowCaption or @_onMobile()

      # Icon is animated separately if cropping is enabled
      if @cropThumbnails
        item.icon.stop(true).animate 
            marginTop: 0
            marginLeft: 0
            width: newTarget.width
            height: newTarget.height
          , @fadeTime, @funcEase 

      # If icon isn't resizeable animate margins
      if item.icon and not item.resizeable
        margin = (@itemProperties.sizeFocused.height - item.icon.height()) / 2
        item.icon.stop(true).animate
            marginTop: margin
            marginBottom: margin
          , @fadeTime
          
    layerFadeOut: (layerNum) =>
      item = @_getItem(layerNum)

      # Make sure the items caption is hidden
      @hideCaption layerNum

      # Replace the items index with the actual slot the item is in
      layerNum = item.currentSlot 
      
      # Get the distance and relative index in relation to the focused element
      [layerDist, layerPos] = @getRelativeItemPosition layerNum

      # Get the absolute layer number difference
      layerDiff = @funcDiff(layerPos - @currentLayer, @, layerNum)
      layerDiff *= -1 if layerPos < @currentLayer
      
      itemWidth = item.sizeSmall.width * @funcSize(layerDiff, @)
      itemHeight = item.sizeSmall.height * @funcSize(layerDiff, @)
      newZ = @zIndex - layerDist
      
      # Modify fading time by items distance to focused item
      fadeTime = @fadeTime + @itemProperties.delay * layerDist
        
      # Get new target for animation
      newTarget =
        width: itemWidth
        height: itemHeight
        left: @funcLeft(layerDiff, @, layerNum) + (@itemProperties.size.width - itemWidth) / 2
        top: @funcTop(layerDiff, @, layerNum) + (@itemProperties.size.height - itemHeight) / 2
        opacity: 0
        
      # Smooth animation when item is visible
      if layerDist <= @visibleItems

        newTarget.opacity = @funcOpacity layerDiff, @, layerNum

        # Do nothing if target hasn't changed
        lastTarget = item.lastTarget
        return if lastTarget \
          and lastTarget.width is newTarget.width \
          and lastTarget.height is newTarget.height \
          and lastTarget.left is newTarget.left \
          and lastTarget.top is newTarget.top \
          and lastTarget.opacity is newTarget.opacity

        item.animating = true
        item.hidden = false

        # Move item to it's new target
        item.object.removeClass("rondellItemNew rondellItemFocused").stop(true)
        .css
          zIndex: newZ
          display: "block"
        .animate newTarget, fadeTime, @funcEase, =>
          # Hide item if it isn't visible anymore
          item.animating = false
          if newTarget.opacity < @opacityMin
            item.hidden = true
            item.object.css "display", "none"
          else
            item.hidden = false
            item.object.css "display", "block"

        # Icon is animated separately if cropping is enabled        
        item.icon.stop(true).animate 
            marginTop: (@itemProperties.size.height - item.croppedSize.height) / 2
            marginLeft: (@itemProperties.size.width - item.croppedSize.width) / 2
            width: item.croppedSize.width
            height: item.croppedSize.height
          , fadeTime, @funcEase if @cropThumbnails

        # Recenter icon if unless it's resizeable
        unless item.small
          item.small = true
          if item.icon and not item.resizeable
            margin = (@itemProperties.size.height - item.icon.height()) / 2
            item.icon.stop(true).animate
                marginTop: margin
                marginBottom: margin
              , fadeTime

      else if item.hidden
        # Update position even if out of view to fix animation when reappearing
        item.object.css newTarget
      else
        # Hide items which are moved out of view
        item.hidden = true
        item.animating = true

        item.object.stop(true)
        .css('z-index', newZ)
        .animate newTarget, fadeTime / 2, @funcEase, =>
          item.animating = false

      # Store last target for this item
      item.lastTarget = newTarget

    shiftTo: (idx, keepOrder=false) =>
      return unless idx?

      # Modify layer number when using index switch because
      # we have to ignore the slot which was initially focused
      if not keepOrder and @switchIndices and idx isnt @currentLayer and @getIndexInRange(idx) is @_focusedItem.currentSlot
        # Get items relative distance
        [distance, relativeIndex] = @getRelativeItemPosition idx, true
        if relativeIndex > @currentLayer then idx++ else idx--

      # Fix new layer number depending on the repeating option
      idx = @getIndexInRange idx

      # Get the items id in the selected layer slot
      newItemIndex = @_itemIndices[idx]

      # Switch item indices if flag is set
      if @switchIndices
        newItem = @_getItem newItemIndex

        # Switch indices in list
        @_itemIndices[idx] = @_focusedItem.id
        @_itemIndices[@_focusedItem.currentSlot] = newItemIndex

        # Tell items about their new slots
        newItem.currentSlot = @_focusedItem.currentSlot
        @_focusedItem.currentSlot = idx

        # Set new focused item
        @_focusedItem = newItem

      # Store the now active layer index
      @currentLayer = idx
      
      # Move all items out of focus except the one we want to focus
      @layerFadeOut(i) for i in [1..@maxItems] when i isnt newItemIndex
      @layerFadeIn newItemIndex
      
      # Update buttons e.g. fadein/out
      @_refreshControls()

      # Fire shift callback
      @onAfterShift? idx

      # Update scrollbar with unmodified idx to prevent jumps
      if @scrollbar.enabled
        scrollbarIdx = idx
        # Fix scrollbar index position for unreachable focus item index
        if idx is @_focusedItem.currentSlot
          scrollbarIdx =  @_focusedItem.currentSlot + 1 
        @scrollbar._instance.setPosition(scrollbarIdx, false)

    getRelativeItemPosition: (idx, wrapIndices=@wrapIndices) =>
      distance = Math.abs(idx - @currentLayer)
      relativeIndex = idx
      
      # Find new layer position if rondell is repeating and indices are wrapped
      if distance > @visibleItems and distance > @maxItems / 2 and @repeating and wrapIndices
        if idx > @currentLayer 
          relativeIndex -= @maxItems 
        else 
          relativeIndex += @maxItems
        distance = Math.abs(relativeIndex - @currentLayer)

      [distance, relativeIndex]

    getIndexInRange: (idx) =>
      if @repeating 
        if idx < 1 
          idx += @maxItems
        else if idx > @maxItems 
          idx -= @maxItems
      else 
        if idx < 1 
          idx = 1 
        else if idx > @maxItems
          idx = @maxItems 
      idx
        
    _refreshControls: =>
      return unless @controls.enabled

      @controls._shiftLeft.stop().fadeTo(@controls.fadeTime, if (@currentLayer > 1 or @repeating) and @hovering then 1 else 0)
      @controls._shiftRight.stop().fadeTo(@controls.fadeTime, if (@currentLayer < @maxItems or @repeating) and @hovering then 1 else 0)
      
    shiftLeft: (e) => 
      e?.preventDefault()
      @shiftTo @currentLayer - 1
        
    shiftRight: (e) => 
      e?.preventDefault()
      @shiftTo @currentLayer + 1
        
    _autoShiftInit: =>
      autoRotation = @autoRotation
      if @isActive() and autoRotation.enabled and autoRotation._timer < 0
        # store timer id and delay next shift
        autoRotation._timer = window.setTimeout @_autoShift, autoRotation.delay

    _autoShift: =>
      # Kill timer id and shift if rondell is active
      @autoRotation._timer = -1
      if @isActive() and @isFocused() and not @autoRotation.paused
        if @autoRotation.direction then @shiftRight() else @shiftLeft()
      else
        # Try to autoshift again after a while
        @_autoShiftInit()
        
    isActive: ->
      true
      
    isFocused: =>
      Rondell.activeRondell is @id
    
    keyDown: (e) =>
      return unless @isActive() and @isFocused()

      # Ignore event if some time has passed since last keyevent
      now = (new Date()).getTime()
      return if @_lastKeyEvent > now - @keyDelay

      # Clear current rotation timer on user interaction
      if @autoRotation._timer >= 0
        window.clearTimeout @autoRotation._timer
        @autoRotation._timer = -1

      @_lastKeyEvent = now
        
      switch e.which
        # arrow left
        when 37 then @shiftLeft(e)
        # arrow right 
        when 39 then @shiftRight(e) 


  class RondellScrollbar
    
    constructor: (container, options) ->
      @container = container.addClass "rondell-scrollbar"
      
      $.extend true, @, $.rondell.defaults.scrollbar, options
      
      @_drag =
        _dragging: false
        _lastDragEvent: 0

      @container.addClass("rondell-scrollbar-#{@orientation}").css @style
        
      @_initControls()

      @_minX = @padding + @scrollLeftControl.outerWidth() + @scrollControl.outerWidth() / 2
      @_maxX = @container.innerWidth() - @padding - @scrollRightControl.outerWidth() - @scrollControl.outerWidth() / 2

      @setPosition @position, false, true

    _initControls: =>
      @scrollLeftControl = $("<div class=\"rondell-scrollbar-left\"><span class=\"rondell-scrollbar-inner\">&nbsp;</span></div>")
        .bind "click", @scrollLeft
        
      @scrollRightControl = $("<div class=\"rondell-scrollbar-right\"><span class=\"rondell-scrollbar-inner\">&nbsp;</span></div>")
        .bind "click", @scrollRight
        
      @scrollControl = $("<div class=\"rondell-scrollbar-control\">&nbsp;</div>").css
        left: @container.innerWidth() / 2
        
      @scrollBackground = $("<div class=\"rondell-scrollbar-background\"/>")
        
      @container.bind "mousedown click", @onControlEvent
      $(window).bind "mousemove mouseup", @onWindowEvent
        
      @container.append @scrollBackground, @scrollLeftControl, @scrollRightControl, @scrollControl
      
    updatePosition: (position, fireCallback=true) =>
      return if not position or position is @position or position < @start or position > @end
      
      @position = position

      # Fire callback with new position
      @onScroll? position, true if fireCallback
      
    scrollTo: (x, animate=true, fireCallback=true) =>
      return if x < @_minX or x > @_maxX
      
      scroller = @scrollControl.stop true
      target = { left: x }
      if animate
        scroller.animate target, @animationDuration, @easing
      else
        scroller.css target

      # Translate event coordinates to new position between start and end option
      newPosition = Math.round((x - @_minX) / (@_maxX - @_minX) * (@end - @start)) + @start
      @updatePosition(newPosition, fireCallback) if newPosition isnt @position
      
    setPosition: (position, fireCallback=true, force=false) =>
      if @repeating
        position = @end if position < @start
        position = @start if position > @end

      return if not force and (position < @start or position > @end or position is @position)
      
      # Translate position to new position for control dot in container
      newX = Math.round((position - @start) / (@end - @start) * (@_maxX - @_minX)) + @_minX
      @scrollTo newX, true, fireCallback

    onWindowEvent: (e) =>
      return unless @_drag._dragging

      if e.type is "mouseup"
        # Release drag on mouseup
        @_drag._dragging = false
        @scrollControl.removeClass "rondell-scrollbar-dragging"
      else if e.type is "mousemove"
        # Move scroll dot to new position
        newX = 0
        if @orientation is "top" or @orientation is "bottom"
          newX = e.pageX - @container.offset().left
        else
          newX = e.pageY - @container.offset().top
        newX = Math.max(@_minX, Math.min(@_maxX, newX))

        @scrollTo newX, false
      
    onControlEvent: (e) =>
      e.preventDefault()

      if e.type is "mousedown" and e.target is @scrollControl[0]
        # Start drag event
        @_drag._dragging = true
        @scrollControl.addClass "rondell-scrollbar-dragging"
      else if e.type is "click" and (e.target is @scrollBackground[0] or e.target is @container[0])
        # Jump to new position when clicking scroller background
        clickTarget = e.pageX - @container.offset().left
        @scrollTo clickTarget
        return false
      
    scrollLeft: (e) =>
      e.preventDefault()
      newPosition = @position - @stepSize
      if @keepStepOrder and @stepSize > 1
        if newPosition >= @start
          newPosition -= (newPosition - @start) % @stepSize
        else if @repeating
          # Move to max position if new position is smaller than start
          newPosition = @start + Math.floor((@end - @start) / @stepSize) * @stepSize
      @setPosition newPosition
      
    scrollRight: (e) =>
      e.preventDefault()
      newPosition = @position + @stepSize
      if @keepStepOrder and @stepSize > 1
        newPosition -= (newPosition - @start) % @stepSize
        if @repeating and newPosition > @end
          newPosition = @start
      @setPosition newPosition
  
  $.fn.rondell = (options={}, callback=undefined) ->
    # Create new rondell instance
    rondell = new Rondell(@, options, @length, callback)
     
    # Setup each item
    @each (idx) ->
      obj = $(@)
      itemIndex = idx + 1
      
      if obj.is('img') or $('img:first', obj).length
        rondell._loadItem itemIndex, obj
      else
        # Init item without an icon
        rondell._initItem itemIndex, 
          object: obj 
          icon: null
          small: false 
          hidden: false
          resizeable: false
          sizeSmall: rondell.itemProperties.size
          sizeFocused: rondell.itemProperties.sizeFocused
        
    # Return rondell instance
    rondell
    
)(jQuery) 
