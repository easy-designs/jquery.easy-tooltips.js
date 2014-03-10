jquery.easy-tooltips.js
=======================

A simple tooltip implementation with Ajax tooltip capabilities.

The API
-------

This plugin makes it easy to manage text-based or rich media tooltips
(gathered via ajax).

Markup Controls:

* `data-tooltip` (str) - The URL to pull as the tooltip or the tooltip trigger
* `data-tooltip-side` (str) - Side to place the tooltip on

Example: 

	<a rel="bookmark" href="/path" data-tooltip="/tooltip/url" data-tooltip-side="top">…</a>
	
This can also be used on other elements, but make sure they are focus-able via keyboards too (using `tabindex="0"`):

	<abbr data-tooltip title="This is my title which will show up in a tooltip" tabindex="0">…</abbr>

Batching
--------

This script will attempt to batch request tooltips who share the same 
root URL by sending all requested tootltip IDs in a comma-separated string.
To return a batch, simply ensure that the HTML fragment contains root 
elements with an id attribute set to "node-id-" followed by the requested
id. The JavaScript will pluck each tooltip out of the response and associate
it with the appropriate element.

Example:

	<a rel="bookmark" href="/path" data-tooltip="/tooltip/for/?id=1234" data-tooltip-side="top">…</a>
	…
	<a rel="bookmark" href="/path" data-tooltip="/tooltip/for/?id=2345" data-tooltip-side="top">…</a>

Results in a request for

	/tooltip/for/?ids=1234,2345

The expected response would be in this format (the use of div being
simply an example):

	<div id="node-id-1234">
		<!-- some content -->
	</div>
	<div id="node-id-2345">
		<!-- other content -->
	</div>