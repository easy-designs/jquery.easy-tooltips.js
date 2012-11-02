/*! (c) Aaron Gustafson (@AaronGustafson). MIT License. http://github.com/easy-designs/jquery.easy-tooltips.js */

/*------------------------------------------------------------------------------
 * API
 * 
 * Documentation to come…
 * 
 * Markup Controls:
 * 
 * bool	data-tooltip
 * 		The URL to pull as the tooltip or the tooltip trigger
 * str	data-tooltip-side
 * 		Side to place the tooltip on
 * 
 * Example: 
 * 
 * 		<a rel="bookmark" href="/path" data-tooltip="/tooltip/url" data-tooltip-side="top">
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
		width,
		height,
		body_o_position;
	
	
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
				endpoint = location.replace( re, '$1' ),
				key = location.replace( re, '$2' ),
				value = location.replace( re, '$3' ),
				text;
			
			// Normal tooltip
			if ( location == '' )
			{
				text = $this.attr('title');
				tooltips[text] = $tooltip.clone()
									.append(
										$('<article><p/></article>')
											.find('p')
												.text(text).end()
									 );
			}
			// Ajax tooltip
			else
			{
				// bow out if we have it
				if ( location in tooltips )
				{
					return;
				}

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
				
				// built he get string
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
						tooltips[tooltip_url] = $tooltip.clone().append($this);
						
					});
					
				}, 'html' );
				
			});
			
		});
		
	}
	$(document).ready(cacheTooltips);
	$(window).on( 'resize load', cacheTooltips );
	
	
	function triggerShow( e )
	{
		var $this = $(this),
			tooltip = $this.data( TOOLTIP ) || $this.attr('title'),
			delay_this = 0;
		
		// catch any stragglers
		if ( ! ( tooltip in tooltips ) )
		{
			cacheTooltips();
			delay_this = delay;
		}

		setTimeout(function(){
			showTooltip( $this, tooltips[tooltip] );
		}, delay_this );
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
	
	function hideTooltip()
	{
		var $link = $(this).removeClass( hover_class ),
			$tip = $link.data('tooltip-div');
		
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
		
	// tooltips should only show on wide screens
	window.watchResize(function(){
		
		watching = width > 480;
		
		if ( watching )
		{
			$( trigger_selector ).hoverIntent({
				over: triggerShow,
				timeout: (delay * 4),
				out: hideTooltip
			});
		}
		else
		{
			$( trigger_selector ).hoverIntent({
				over: function(){},
				timeout: 0,
				out: function(){}
			});
		}
		
	});

})( jQuery, window );