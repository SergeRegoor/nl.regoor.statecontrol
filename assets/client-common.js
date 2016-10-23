$(document).ready(function(){
	$('a.newWindow').click(function(e){
		e.preventDefault();
		window.open($(this).attr('href'));
	});
	
	$('.copyToClipboard').click(function(e){
		e.preventDefault();
		copyToClipboard($($(this).attr('rel-selector')));
		var valueDescription = $(this).attr('rel-description');
		if (valueDescription.length > 0)
			alert(valueDescription + ' ' + __('clipboard_xxxxx_copied'));
		else
			alert(__('clipboard_value_copied'));
	});
});

$.fn.loadLocalizedTexts = function() {
	$(this).find('*[rel-localized!=""]').each(function(){
		if (($(this).attr('rel-localized') != null) && ($(this).attr('rel-localized').length > 0)) {
			var localizedTextFor = $(this).attr('rel-localized-for');
			var localizedTextId = $(this).attr('rel-localized');
			var localizedText = __(localizedTextId);
			if ((localizedTextFor != null) && (localizedTextFor.length > 0))
				$(this).attr(localizedTextFor, localizedText);
			else if ((localizedText.indexOf('/>') >= 0) || (localizedText.indexOf('</') >= 0))
				$(this).html(localizedText);
			else
				$(this).text(localizedText);
			$(this).find('a.newWindow').click(function(e){
				e.preventDefault();
				window.open($(this).attr('href'));
			});
		}
	});
}

function copyToClipboard(obj) {
	var value = '';
	if (obj.is('input') || obj.is('textarea') || obj.is('textarea'))
		value = obj.val();
	else
		value = obj.text();
	
	var hiddenObj = $('<input>').addClass('clipboardInput');
	$('body').append(hiddenObj);
	hiddenObj.val(value);
	hiddenObj.select();
	
    var isSuccessful;
    try {
    	  isSuccessful = document.execCommand("copy");
    } catch(e) {
        isSuccessful = false;
    }
    
    hiddenObj.remove();
	return isSuccessful;
}

// Create unique GUID
function createGuid() { 
	var s4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
	return (s4() + s4() + "-" + s4() + "-4" + s4().substr(0,3) + "-" + s4() + "-" + s4() + s4() + s4()).toLowerCase();
};

function findObjInArray(arr, prop, val) {
	var items = $.grep(arr, function(item){ return item[prop] == val; });
	if (items.length > 0)
		return items[0];
	return null;
}

$.fn.insert = function(index, obj) {
	if (index == 0)
		$(this).prepend(obj);
	else
		$(this).children().eq(index - 1).after(obj);
	return $(this);
}

// Load & show popup
function loadPopup(id, selector, zIndex, width, height){
	$('body').css('overflow','hidden');
	var popupBackground = $('<div>').addClass('popupBackground').attr('id', id+'Background').css('height', $('body').height());
	popupBackground.css('z-index', zIndex-1);
	var popupContainer = $('<div>').addClass('popupContainer').attr('id', id);
	if (selector != null)
		popupContainer.html(selector.html());
	popupContainer.find('.closePopup').click(function(){ popupContainer.closePopup(); });
	popupContainer.css('z-index', zIndex);
	popupContainer.css('width', 'calc('+width+'px - 40px)');
	popupContainer.css('height', 'calc('+height+'px - 40px)');
	popupContainer.css('margin', '0 0 0 -'+(width/2)+'px');
	$('body').append(popupBackground);
	$('body').append(popupContainer);
	return popupContainer;
};

// Close a popup
$.fn.closePopup = function(){
	var popupContainer = $(this);
	var popupId = popupContainer.attr('id');
	var popupBackground = $('#'+popupId+'Background');
	popupContainer.remove();
	popupBackground.remove();
	$('body').css('overflow','auto');
};