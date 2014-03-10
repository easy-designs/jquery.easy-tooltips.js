/*! (c) Aaron Gustafson (@AaronGustafson). MIT License. http://github.com/easy-designs/jquery.easy-tooltips.js */

/*------------------------------------------------------------------------------
 * API
 * 
 * This plugin makes it easy to manage text-based or rich media tooltips
 * (gathered via ajax).
 * 
 * Markup Controls:
 * 
 * str	data-tooltip
 * 		The URL to pull as the tooltip or the tooltip trigger
 * str	data-tooltip-side
 * 		Side to place the tooltip on
 * 
 * Example: 
 * 
 * 		<a rel="bookmark" href="/path"
 * 		   data-tooltip="/tooltip/url"
 * 		   data-tooltip-side="top">
 * 
 * This can also be used on other elements, but make sure they are focus-able 
 * via keyboards too (using tabindex="0"):
 *
 * 		<abbr data-tooltip
 * 			title="This is my title which will show up in a tooltip"
 * 			tabindex="0">…</abbr>
 * 
 * Batching
 * 
 * This script will attempt to batch request tooltips who share the same 
 * root URL by sending all requested tootltip IDs in a comma-separated string.
 * To return a batch, simply ensure that the HTML fragment contains root 
 * elements with an id attribute set to "node-id-" followed by the requested
 * id. The JavaScript will pluck each tooltip out of the response and associate
 * it with the appropriate element.
 * 
 * 	Example:
 * 
 * 		<a rel="bookmark" href="/path"
 * 		   data-tooltip="/tooltip/for/?id=1234"
 * 		   data-tooltip-side="top">
 * 		<a rel="bookmark" href="/path"
 * 		   data-tooltip="/tooltip/for/?id=2345"
 * 		   data-tooltip-side="top">
 * 
 * 		Results in a request for
 * 
 * 		/tooltip/for/?ids=1234,2345
 * 
 * 		The expected response would be in this format (the use of div being
 * 		simply an example):
 * 
 * 		<div id="node-id-1234">
 * 			<!-- some content -->
 * 		</div>
 * 		<div id="node-id-2345">
 * 			<!-- other content -->
 * 		</div>
 * 
 * ---------------------------------------------------------------------------*/

;(function( $, window, UNDEFINED ){
	
	var TOOLTIP = 'tooltip',
		ID = 'id',
		hover_class = 'hovering',
		trigger_selector = '[data-' + TOOLTIP + ']',
		$tooltip = $('<div class="' + TOOLTIP + '-box" aria-live="polite" role="alert"/>').hide(),
		tooltip_selector = '#' + $tooltip.attr( ID ),
		tooltips = {},
		fade_speed = 'fast',
		$window = $(window),
		$body = $('body'),
		delay = 500,
		side_offset = 30,
		arrow_offset = 20,
		t_width = 260,
		TRUE = true,
		FALSE = false,
		NULL = null,
		showing = NULL,
		hiding = NULL,
		active = FALSE,
		watching = FALSE,
		toolKey = "id",
		width,
		height,
		body_o_position,
		unique = ( new Date() ).getTime(),
		tap_evt = ('ontouchstart' in window || 'createTouch' in document) ? 'touchstart' : 'click';
	
	
	// resize watcher
	window.watchResize = function(callback)
	{
		var resizing;
		function done()
		{
			clearTimeout( resizing );
			resizing = NULL;
			callback();
		}
		$window.resize(function(){
			if ( resizing )
			{
				clearTimeout( resizing );
				resizing = NULL;
			}
			resizing = setTimeout( done, 50 );
		});
		// init
		$(callback);
	};
	
	// dimensions
	function getDimensions()
	{
		width = $window.width();
		height = $body.height();
		watching = width > 480;
	}
	window.watchResize(getDimensions);
	
	function cacheTooltips()
	{
		if ( ! watching )
		{
			return;
		}

		var $items = $( trigger_selector ),
			batches = {},
			re = /(.+)\?(.+)=(.+)/,
			url;

		$items.each(function(){
			
			var $this = $(this),
				location = $this.data( TOOLTIP ),
				$preloaded_tip = $this.data( 'preloaded-' + TOOLTIP ),
				isQuery,
				endpoint,
				key,
				value,
				text;
			
			// bow out if we have it
			if ( location != '' &&
				 location in tooltips )
			{
				return;
			}

			isQuery = location.indexOf("?");
			endpoint = isQuery >= 0 ? location.replace( re, '$1' ) : location.substr(0, location.lastIndexOf('/'));
			key = isQuery >= 0 ? location.replace( re, '$2' ) : '';
			value = isQuery >= 0 ? location.replace( re, '$3' ) : location.substr(location.lastIndexOf('/') + 1);

			if ( location == '' )
			{
				// Pre-loaded
				if ( $preloaded_tip )
				{
					location = unique++;
					$this.data( TOOLTIP, location );
					tooltips[location] = $tooltip.clone()
											.append(
												$preloaded_tip
											 );
				}
				// Normal tooltip
				else
				{
					text = $this.attr('title');
					tooltips[text] = $tooltip.clone()
										.append(
											$('<article><p/></article>')
												.find('p')
													.text(text).end()
										 );
				}
			}
			// Ajax tooltip
			else
			{
				
				// set up the hash
				if ( batches[endpoint] == UNDEFINED )
				{
					batches[endpoint] = {};
				}
				if ( batches[endpoint][key] == UNDEFINED )
				{
					batches[endpoint][key] = [];
				}

				// push the value
				if ( $.inArray( value, batches[endpoint][key] ) == -1 )
				{
					batches[endpoint][key].push( value );
				}
				
			}
		});
		
		// now load the batches into the tooltips object
		$.each( batches, function( url, obj ){
			
			// keys may differ
			$.each( obj, function( key, value ){
				$isQuery = (key != '');
				
				if ($isQuery) {
					// build the get string
					var get = {};
					get[key] = value.join(',');
					
					$.get( url, get, function( data ){
						
						var $data = $('<div/>').html(data),
							$t = $data.find('.' + TOOLTIP + '-item');
						
						$t.each(function(){
							
							var $this = $(this),
								id = $this.attr( ID ).replace('node-id-',''),
								tooltip_url = url + '?' + key + '=' + id;
							
							// cache the tooltip
							tooltips[tooltip_url] = $tooltip.clone()
														.append($this);
							
						});
						
					}, 'html' );
				} else {
					$.post( url + '/' + value, function( data ) {
						var $data = $('<div/>').html(data),
							$t = $data.find('.' + TOOLTIP + '-item');
						
						$t.each(function(){
							
							var $this = $(this),
								id = $this.attr( ID ).replace('node-id-',''),
								tooltip_url = url + '/' + id;
							
							// cache the tooltip
							tooltips[tooltip_url] = $tooltip.clone()
														.append($this);
							
						});
					}, 'html');
				}
				
				
			});
			
		});
		
	}
	$(document).ready(cacheTooltips);
	$(window).on( 'resize load', cacheTooltips );
	
	function triggerShow( e )
	{
		e.preventDefault();
		var $this = $(e.target).closest( trigger_selector ),
			tooltip = $this.data( TOOLTIP ) || $this.data( TOOLTIP + 'title' ),
			delay_this = 0;
		
		// catch any stragglers
		if ( ! ( tooltip in tooltips ) )
		{
			cacheTooltips();
			delay_this = delay;
		}
		
		$( '.' + TOOLTIP + '-box' )
			.fadeOut( fade_speed, function(){
				$(this).remove();
			});

		setTimeout(function(){
			showTooltip( $this, tooltips[tooltip] );
		}, delay_this );
		
		return FALSE;
	}
	
	function showTooltip( $trigger, $tooltip )
	{
		body_o_position = $body.css('position');
		if ( body_o_position == 'static' )
		{
			$body.css('position','relative');
		}
		
		getDimensions();
		
		var coords = $trigger.offset(),
			side = $trigger.data('tooltip-side') || 'right',
			$tip = $trigger.data('tooltip-div'),
			trigger_width = $trigger.outerWidth(),
			position, tip_width;
		
		if ( $tip == UNDEFINED &&
			 $tooltip != UNDEFINED )
		{
			$tip = $tooltip.clone( TRUE );
			$trigger.data( 'tooltip-div', $tip );
		}

		$tip.appendTo( $body )
			.addClass( TOOLTIP + '-' + side );
		
		tip_width = $tip.outerWidth();
		
		switch ( side )
		{
			case 'top':
				position = {
					bottom: Math.floor( height - coords.top + ( side_offset / 2 ) ),
					left: coords.left + ( trigger_width / 2 ),
					'margin-left': 0 - ( tip_width / 2 )
				};
				break;
			case 'bottom':
				position = {
					top: Math.floor( coords.top + $trigger.outerHeight() + ( side_offset / 2 ) ),
					left: coords.left + ( trigger_width / 2 ),
					'margin-left': 0 - ( tip_width / 2 )
				};
				break;
			case 'left':
				position = {
					top: Math.floor( coords.top ),
					right: width - coords.left + side_offset
				};
				break;
			// right
			default:
				position = {
					top: Math.floor( coords.top ),
					left: coords.left + trigger_width + side_offset
				};
		}

		$tip.css( position )
			.fadeIn( fade_speed, function(){
				$trigger.addClass( hover_class );
			 });

		active = TRUE;
	}
	
	function hideTooltip(e)
	{
		var $this = $(e.target).closest( trigger_selector )
						.removeClass( hover_class ),
			$tip = $this.data('tooltip-div');
		
		if ( $tip != UNDEFINED )
		{
			$tip.fadeOut( fade_speed, function(){
				$tip.remove();
			});
		}
        
		active = FALSE;
		
		// re position the body
		$body.css('position',body_o_position);
	}
	
	function emptyFunc(){};
		
	// tooltips should only show on wide screens
	window.watchResize(function(){
		
		var timer = NULL;
		
		function show( e )
		{
			// suppress titles
			var o_title = $(this).attr('title');
			if ( o_title )
			{
				$(this)
					.removeAttr( 'title' )
					.data( TOOLTIP + 'title', o_title );
			}
			
			timer = setTimeout(function(){
				triggerShow(e);
			}, delay);
		}
		function hide( e )
		{
			if ( timer )
			{
				clearTimeout( timer );
				timer = NULL;
			}
			hideTooltip(e);
			
			// suppress titles
			var o_title = $(this).data( TOOLTIP + 'title' );
			if ( o_title )
			{
				$(this).attr( 'title', o_title );
			}
		}
		function checkKeyup( e )
		{
			var key = e.which;
			if ( key == 13 )
			{
				$(this).triggerHandler('mouseenter');
			}
			else if ( key == 27 )
			{
				$(this).triggerHandler('mouseleave');
			}
		}
	
		
		if ( ! watching )
		{
			$( trigger_selector )
				// keyboard
				.off( 'keyup', checkKeyup )
				.off( 'blur', hide )
				// touch
				.off( tap_evt, triggerShow )
				// mouse
				.off( 'mouseenter', show )
				.off( 'mouseleave',  hide );
		}
		else
		{
			$( trigger_selector )
				// keyboard
				.on( 'keyup', checkKeyup )
				.on( 'blur', hide )
				// touch
				.on( tap_evt, triggerShow )
				// mouse
				.on( 'mouseenter', show )
				.on( 'mouseleave',  hide );
		}
	});
	
})( jQuery, window );
