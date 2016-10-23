var _settingsKey = 'statecontrol-settings';
var _settings = {};

// Array which will contain all tabs
var tabs = [];

// Definition of list types
var listTypes = [
	{
		type: 'stateGroups',
		title: 'State groepen',
		explanation: 'uitleg over state groepen',
		addButtonText: 'Toevoegen',
		source: '_settings.stateGroups',
		columns: [
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' }
		],
		filter: null,
		formType: 'stateGroup',
		deleteItem: function(parentId, stateGroup) {
			var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.stateGroupId == stateGroup.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(state){ return state.stateGroupId == stateGroup.id; }).length;
			var nrOfActions = $.grep(_settings.actions, function(action){ return action.stateGroupId == stateGroup.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state group is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de state groep "'+stateGroup.description+'" wilt verwijderen?')) return false;
			_settings.stateGroups = $.grep(_settings.stateGroups, function(item){ return item.id != stateGroup.id; });
			saveSettings();
			initializeTabs();
			$('.tabControl').invalidateTabs();
			$('.list[rel-listtype="stateGroups"]').renderList();
			return true;
		}
	},
	{
		type: 'rooms',
		title: 'Ruimtes',
		explanation: 'uitleg over rooms',
		addButtonText: 'Toevoegen',
		source: '_settings.rooms',
		columns: [
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'stateId', title:'State', propertyType:'state' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'room',
		deleteItem: function(parentId, room) {
			if (!confirm('Weet je zeker dat je de ruimte "'+room.description+'" wilt verwijderen?\nFlows waarin je deze ruimte gebruikt, zullen niet meer werken.')) return false;
			_settings.rooms = $.grep(_settings.rooms, function(item){ return item.id != room.id; });
			saveSettings();
			$('.list[rel-listtype="rooms"][rel-parentid="'+room.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'states',
		title: 'States',
		explanation: 'uitleg over states',
		addButtonText: 'Toevoegen',
		source: '_settings.states',
		columns: [
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'isOverruling', title:'Prioriteit', propertyType:'boolean' }
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'state',
		deleteItem: function(parentId, state) {
			var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.stateId == state.id; }).length;
			var nrOfStates = $.grep(_settings.states, function(sta){ return sta.delayStateId == state.id; }).length;
			var nrOfActions = $.grep(_settings.actions, function(action){ return action.nextStateId == state.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de state "'+state.description+'" wilt verwijderen?\nFlows waarin je deze state gebruikt, zullen niet meer werken.')) return false;
			_settings.states = $.grep(_settings.states, function(item){ return item.id != state.id; });
			saveSettings();
			$('.list[rel-listtype="states"][rel-parentid="'+state.stateGroupId+'"]').renderList();
			return true;
		}
	},
	{
		type: 'actions',
		title: 'Acties',
		explanation: 'uitleg over acties',
		addButtonText: 'Toevoegen',
		source: '_settings.actions',
		columns: [
			{ type:'edit', title:'' },
			{ type:'delete', title:'' },
			{ property:'description', title:'Omschrijving' },
			{ property:'isActive', title:'Actief', propertyType:'boolean' },
			{ property:'nextStateId', title:'Set state', propertyType:'state' },
			{ property:'performActionId', title:'Vervolg actie', propertyType:'action' },
		],
		filter: { property:'stateGroupId', compareTo:'parentId' },
		formType: 'action',
		deleteItem: function(parentId, action) {
			//var nrOfRooms = $.grep(_settings.rooms, function(room){ return room.actionId == action.id; }).length;
			var nrOfRooms = 0;
			var nrOfStates = $.grep(_settings.states, function(state){ return state.delayActionIdId == action.id; }).length; // not used yet
			var nrOfActions = $.grep(_settings.actions, function(act){ return act.performActionId == action.id; }).length;
			if ((nrOfRooms > 0) || (nrOfStates > 0) || (nrOfActions)) {
				var errorMessage = 'De state is nog in gebruik (';
				if (nrOfRooms == 1) errorMessage += '1 ruimte'; else if (nrOfRooms > 1) errorMessage += nrOfRooms + ' ruimtes';
				if ((nrOfRooms >= 1) && (nrOfStates >= 1)) errorMessage += ', ';
				if (nrOfStates == 1) errorMessage += '1 state'; else if (nrOfStates > 1) errorMessage += nrOfStates + ' states';
				if (((nrOfRooms+nrOfStates) >= 1) && (nrOfActions >= 1)) errorMessage += ', ';
				if (nrOfActions == 1) errorMessage += '1 actie'; else if (nrOfActions > 1) errorMessage += nrOfActions + ' acties';
				errorMessage += ').';
				alert(errorMessage);
				return false;
			}
			if (!confirm('Weet je zeker dat je de actie "'+action.description+'" wilt verwijderen?\nFlows waarin je deze actie gebruikt, zullen niet meer werken.')) return false;
			_settings.actions = $.grep(_settings.actions, function(item){ return item.id != action.id; });
			saveSettings();
			$('.list[rel-listtype="actions"][rel-parentid="'+action.stateGroupId+'"]').renderList();
			return true;
		}
	}
];

// Definition of form types
var formTypes = [
	{
		type: 'stateGroup',
		source: '_settings.stateGroups',
		filter: null,
		listType: 'stateGroups',
		fields: [
			{ property:'description', title:'Omschrijving', isMandatory:true }
		],
		afterSave: function(stateGroup) { initializeTabs(); $('.tabControl').invalidateTabs(); }
	},
	{
		type: 'room',
		source: '_settings.rooms',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'rooms',
		fields: [
			{ property:'description', title:'Omschrijving', isMandatory:true },
			{ property:'isActive', title:'Actief', propertyType:'boolean', defaultValue:true },
			{ property:'stateId', title:'State', propertyType:'state', info:'Wanneer je de state handmatig wijzigt, worden eventuele flows getriggered.' }
		]
	},
	{
		type: 'state',
		source: '_settings.states',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'states',
		fields: [
			{ property:'description', title:'Omschrijving', isMandatory:true },
			{ property:'isActive', title:'Actief', propertyType:'boolean', defaultValue:true },
			{ property:'isOverruling', title:'Prioriteit', propertyType:'boolean', defaultValue:false, info:'Andere states mogen deze state niet overschrijven, tenzij ze zelf overruling zijn.' }
		]
	},
	{
		type: 'action',
		source: '_settings.actions',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'actions',
		fields: [
			{ property:'description', title:'Omschrijving', isMandatory:true },
			{ property:'isActive', title:'Actief', propertyType:'boolean', defaultValue:true },
			{ property:'ignoreOverruling', title:'Negeer "overruling" bij opvolgende state', propertyType:'boolean', defaultValue:false, info:'Vink deze optie aan als je opvolgende state niet overruling is, maar je de opvolgende state alsnog wilt instellen met deze actie.' },
			{ property:'nextStateId', title:'Opvolgende state', propertyType:'state', addEmptyItem:true },
			{ property:'performActionId', title:'Vervolg actie uitvoeren', propertyType:'action', addEmptyItem:true, info:'Als je een opvolgende state hebt opgegeven, wordt deze actie alleen uitgevoerd als de opvolgende state kon worden toegepast. Zonder opvolgende state wordt de vervolg actie altijd uitgevoerd.' }
		]
	}
];

$(document).ready(function(){
});

$.fn.selectTab = function() {
	var tabObj = $(this);
	$('.tabControl .tab').removeClass('active');
	$('.tabControl .page').removeClass('active');
	tabObj.addClass('active');
	$('.tabControl .page').eq(tabObj.index()).addClass('active');
}

$.fn.invalidateTabs = function() {
	var tabControlObj = $(this);
	tabControlObj.find('.tab').each(function(){
		var tabObj = $(this);
		var tab = findObjInArray(tabs, 'parentId', tabObj.attr('rel-parentid'));
		if (tab == null) {
			tabControlObj.find('.page').eq(tabObj.index()).remove();
			tabObj.remove();
		} else {
			tabObj.text(tab.title);
			tabControlObj.find('.page').eq(tabObj.index()).find('.tabTitle').text(tab.title);
		}
	});
	$.each(tabs, function(i, tab){
		var tabObj = tabControlObj.find('.tab[rel-parentid="'+tab.parentId+'"]');
		if (tabObj.length == 0)
			loadTab(tab, i);
	});
}

function onHomeyReady(){
	Homey.get(_settingsKey, function(error, settingValue){ 
		_settings = settingValue;
		if (_settings == null) _settings = {};
		if (_settings.stateGroups == null) _settings.stateGroups = [];
		if (_settings.rooms == null) _settings.rooms = [];
		if (_settings.states == null) _settings.states = [];
		if (_settings.actions == null) _settings.actions = [];
		
		initializeTabs();
		$.each(tabs, function(i, tab){ loadTab(tab, i); });
		$('.tabControl .tab').eq(0).selectTab();
	});
	
	Homey.ready();
};

function initializeTabs() {
	tabs = [];
	$.each(_settings.stateGroups, function(i, stateGroup){ addStateGroupTab(stateGroup); });
	addSettingsTab();
}

function saveSettings() {
	Homey.set(_settingsKey, _settings);	
};

function addStateGroupTab(stateGroup) { tabs[tabs.length] = { title:stateGroup.description, parentId:stateGroup.id, controls:[{type:'list', listType:'rooms' }, {type:'list', listType:'states' }, {type:'list', listType:'actions' }] }; }
function addSettingsTab() { tabs[tabs.length] = { title:'Instellingen', parentId:'', controls:[{type:'list', listType:'stateGroups' }] }; }

// Load the tab and its controls
function loadTab(tab, index) {
	// Add tab item & page
	$('.tabControl .tabs').insert(index, $('<div/>').addClass('tab').text(tab.title).attr('rel-parentid', tab.parentId).click(function(){ $(this).selectTab(); }));
	var page = $('<div/>').addClass('page');
	$('.tabControl .pages').insert(index, page).attr('rel-parentid', tab.parentId);
	page.append($('<h2/>').addClass('tabTitle').text('Groep ' + tab.title));
	
	// Iterate through defined controls, and add them
	$.each(tab.controls, function(i, control){
		if (control.type == 'list')
			loadList(control.listType, tab.parentId, page);
	});
}

// Load a list into its container
function loadList(listTypeName, parentId, containerObj) {
	// Find the list type
	var listType = findObjInArray(listTypes, 'type', listTypeName);
	if (listType == null) return;
	
	// Add the list's container, title and explanation
	var listParentObj = $('<fieldset/>');
	containerObj.append(listParentObj);
	listParentObj.append($('<legend/>').text(listType.title));
	listParentObj.append($('<p/>').text(listType.explanation));
	
	// Create the list object
	var listObj = $('<div/>').addClass('list').attr('rel-parentid', parentId).attr('rel-listtype', listTypeName);
	listParentObj.append(listObj);
	
	// Add button
	var addButtonObj = $('<button/>').text(listType.addButtonText).attr('rel-parentid', parentId).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); });
	listParentObj.append(addButtonObj);
	
	// Add the header row and its columns
	var headRowObj = $('<div/>').addClass('row head');
	listObj.append(headRowObj);
	$.each(listType.columns, function(i, column){ headRowObj.append($('<div/>').addClass('col').text(column.title)); });
	
	// Render the list
	listObj.renderList();
}

// Render a list's items
$.fn.renderList = function() {
	// Get the list object and the list type definition
	var listObj = $(this);
	var listType = findObjInArray(listTypes, 'type', listObj.attr('rel-listtype'));
	if (listType == null) return;
	
	// Remove current item rows
	listObj.find('.row.item').remove();
	
	// Determine source items (and if specified, with filter)
	var compareToValue = '';
	if ((listType.filter != null) && (listType.filter.compareTo == 'parentId'))
		compareToValue = listObj.attr('rel-parentid');
	var sourceItems = getFilteredSourceItems(listType.source, listType.filter, compareToValue);
	
	if ((sourceItems == null) || (sourceItems.length == 0))
		listObj.hide();
	else
		listObj.show();
	
	// Iterate through the source items and create the rows
	$.each(sourceItems, function(e, sourceItem){
		// Create the row
		var rowObj = $('<div/>').addClass('row item').attr('rel-id', sourceItem.id);
		listObj.append(rowObj);
		
		// Iterate through the columns to add as cells
		$.each(listType.columns, function(i, column){
			var cellObj = $('<div/>').addClass('col');
			if (column.type == 'edit')
				cellObj.append($('<button/>').text('Wijzig').attr('rel-id',sourceItem.id).attr('rel-parentid', listObj.attr('rel-parentid')).attr('rel-formtype', listType.formType).click(function(){ $(this).showForm(); }));
			else if (column.type == 'delete') {
				cellObj.append($('<button/>').text('Verwijder').attr('rel-id',sourceItem.id).attr('rel-parentid', listObj.attr('rel-parentid')).click(function(){ if (listType.deleteItem != null) listType.deleteItem(listObj.attr('rel-parentid'), sourceItem); }));
			} else {
				var cellValue = '';
				if (column.propertyType == 'boolean')
					cellValue = sourceItem[column.property] ? 'Ja' : 'Nee';
				else if (column.propertyType == 'state') {
					var state = findObjInArray(_settings.states, 'id', sourceItem[column.property]);
					if (state != null) cellValue = state.description;
				}
				else if (column.propertyType == 'action') {
					var action = findObjInArray(_settings.actions, 'id', sourceItem[column.property]);
					if (action != null) cellValue = action.description;
				}
				else
					cellValue = sourceItem[column.property];
				cellObj.text(cellValue);
			}
			rowObj.append(cellObj);
		});
	});
}

function getFilteredSourceItems(source, filter, compareToValue) {
	var sourceItems = eval(source);
	if (filter != null)
		sourceItems = $.grep(sourceItems, function(item){ return item[filter.property] == compareToValue; });
	return sourceItems;
}

// Show a popup with a form
$.fn.showForm = function() {
	// Get the button object and the settings from its attributes
	var buttonObj = $(this);
	var parentId = buttonObj.attr('rel-parentid');
	var itemId = buttonObj.attr('rel-id');
	if ((itemId == null) || (itemId.length == 0)) itemId = '';
	
	// Get the form type
	var formTypeName = buttonObj.attr('rel-formtype');
	var formType = findObjInArray(formTypes, 'type', formTypeName);
	if (formType == null) return;
	
	// Create the popup
	var popupHeight = 75;
	$.each(formType.fields, function(i, field){
		var fieldType = getFieldTypeOfFormField(field);
		if (fieldType == 'boolean')
			popupHeight += 35;
		else
			popupHeight += 65;
	});
	var popupContainer = loadPopup(createGuid(), null, 100, 450, popupHeight);
	
	// Get the source item, or create a new one
	var compareToValue = '';
	if ((formType.filter != null) && (formType.filter.compareTo == 'parentId'))
		compareToValue = parentId;
	var sourceItems = getFilteredSourceItems(formType.source, formType.filter, compareToValue);
	var sourceItem = findObjInArray(sourceItems, 'id', itemId);
	if (sourceItem == null) {
		sourceItem = { id:createGuid() };
		if ((formType.filter != null) && (formType.filter.property != null) && (parentId != null) && (parentId.length > 0))
			sourceItem[formType.filter.property] = parentId;
		// Fill the new source item with default values
		$.each(formType.fields, function(i, field){
			var defaultValue = '';
			if (field.defaultValue != null)
				defaultValue = field.defaultValue;
			sourceItem[field.property] = defaultValue;
		});
	}
	
	// Render the fields
	$.each(formType.fields, function(i, field){
		var fieldType = getFieldTypeOfFormField(field);
		var fieldRowObj = $('<div/>').addClass('field row');
		popupContainer.append(fieldRowObj);
		if ((field.info != null) && (field.info.length > 0))
			fieldRowObj.append($('<div/>').addClass('infoTooltip').text(field.info).click(function(){
				var tooltipPopup = loadPopup(createGuid(), null, 200, 450, 175);
				tooltipPopup.append($('<p/>').text(field.info));
				tooltipPopup.append($('<button/>').addClass('right').text('Sluiten').click(function(){ tooltipPopup.closePopup(); }));
			}));
		if (fieldType == 'boolean')
			fieldRowObj.append($('<input/>').attr('type', 'checkbox').attr('id', 'field'+field.property).prop('checked', sourceItem[field.property]));
		fieldRowObj.append($('<label/>').attr('for', 'field'+field.property).text(field.title));
		if (fieldType == 'text')
			fieldRowObj.append($('<input/>').attr('type', 'text').attr('id', 'field'+field.property).val(sourceItem[field.property]));
		else if ((fieldType == 'state') || (fieldType == 'action')) {
			var selectObj = $('<select/>').attr('id', 'field'+field.property);
			fieldRowObj.append(selectObj);
			if (field.addEmptyItem) selectObj.append($('<option/>').val('').text(''));
			var listItems = [];
			if (fieldType == 'state')
				listItems = _settings.states;
			else if (fieldType == 'action')
				listItems = _settings.actions;
			$.each($.grep(listItems, function(item){ return (item.stateGroupId == parentId) && (item.id != sourceItem.id); }), function(i, item){
				selectObj.append($('<option/>').val(item.id).text(item.description));
			});
			selectObj.val(sourceItem[field.property]);
		}
		if (i == 0) fieldRowObj.find('input').eq(0).focus();
	});
	
	// Add the save button
	popupContainer.append($('<button/>').addClass('right').text('Bewaren').click(function(){
		// Validate input
		var errorMessages = '';
		$.each(formType.fields, function(i, field){
			if ((field.isMandatory != null) && field.isMandatory && (getFieldValueOfFormField(popupContainer, field).toString().length == 0))
				errorMessages += field.title + ' is verplicht.\n';
		});
		if (errorMessages.length > 0) { alert(errorMessages); return; }
		
		// Save field values to source item
		$.each(formType.fields, function(i, field){
			sourceItem[field.property] = getFieldValueOfFormField(popupContainer, field);
		});
		
		// Add the source item to its source, if it's new
		var unfilteredSourceItems = eval(formType.source);
		if (findObjInArray(unfilteredSourceItems, 'id', sourceItem.id) == null)
			unfilteredSourceItems[unfilteredSourceItems.length] = sourceItem;
		
		// Save settings
		saveSettings();
		if (formType.afterSave != null)
			formType.afterSave(sourceItem);
		
		// Render the parent list
		$('.list[rel-listtype="'+formType.listType+'"][rel-parentid="'+parentId+'"]').renderList();
		
		popupContainer.closePopup();
	}));
	
	// Add the cancel button
	popupContainer.append($('<button/>').addClass('right').text('Annuleren').click(function(){ popupContainer.closePopup(); }));
}

function getFieldTypeOfFormField(field) {
	var fieldType = '';
	if (field.propertyType != null)
		fieldType = field.propertyType;
	if ((fieldType == null) || (fieldType.length == 0))
		fieldType = 'text';
	return fieldType;
}

function getFieldValueOfFormField(formContainer, field) {
	var fieldType = getFieldTypeOfFormField(field);
	var fieldObj = formContainer.find('#field'+field.property);
	var fieldValue = '';
	if (fieldType == 'boolean')
		fieldValue = fieldObj.prop('checked');
	else
		fieldValue = fieldObj.val();
	return fieldValue;
}
