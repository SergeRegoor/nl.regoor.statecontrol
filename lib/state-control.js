var obj = StateControl.prototype;

function StateControl(){
	this._settingsKey = 'statecontrol-settings';
	this._settings = Homey.manager('settings').get(this._settingsKey);
}

obj.getStateGroupById = function(stateGroupId) {
	if (this._settings.stateGroups == null) return null;
	if (stateGroupId == null) return null;
	for (var idx = 0; idx < this._settings.stateGroups.length; idx++)
		if (this._settings.stateGroups[idx].id == stateGroupId)
			return this._settings.stateGroups[idx];
	return null;
}

obj.getRoomById = function(roomId) {
	if (this._settings.rooms == null) return null;
	if (roomId == null) return null;
	for (var idx = 0; idx < this._settings.rooms.length; idx++)
		if (this._settings.rooms[idx].id == roomId)
			return this._settings.rooms[idx];
	return null;
}

obj.getStateById = function(stateId) {
	if (this._settings.states == null) return null;
	if (stateId == null) return null;
	for (var idx = 0; idx < this._settings.states.length; idx++)
		if (this._settings.states[idx].id == stateId)
			return this._settings.states[idx];
	return null;
}

obj.getActionById = function(actionId) {
	if (this._settings.actions == null) return null;
	if (actionId == null) return null;
	for (var idx = 0; idx < this._settings.actions.length; idx++)
		if (this._settings.actions[idx].id == actionId)
			return this._settings.actions[idx];
	return null;
}

obj.saveRoomState = function(room, stateId) {
	if (room == null) return false;
	var tempSettings = Homey.manager('settings').get(this._settingsKey);
	if ((tempSettings == null) || (tempSettings.rooms == null)) return false;
	var haveSetState = false;
	for (var idx = 0; idx < tempSettings.rooms.length; idx++)
		if (tempSettings.rooms[idx].id == room.id) {
			tempSettings.rooms[idx].stateId = stateId;
			haveSetState = true;
		}
	if (haveSetState) {
		Homey.manager('settings').set(this._settingsKey, tempSettings);
		room.stateId = stateId;
		return true;
	}
	return false;
}

obj.createGuid = function() { 
	var s4 = function() { return (((1+Math.random())*0x10000)|0).toString(16).substring(1); };
	return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0,3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
};

obj.secondsSinceEpoch = function(){ 
	return Math.floor(Date.now() / 1000);
}

obj.getStateGroups = function() {
	return this._settings.stateGroups;
}

obj.getRooms = function() {
	return this._settings.rooms;
}

obj.getStates = function() {
	return this._settings.states;
}

obj.getActions = function() {
	return this._settings.actions;
}

obj.getStateGroupsForAutocomplete = function() {
	var stateGroups = this.getStateGroups();
	var items = [];
	if (stateGroups != null)
		for (var idx = 0; idx < stateGroups.length; idx++)
			items[items.length] = {
				stateGroupId: stateGroups[idx].id,
				name: stateGroups[idx].description
			};
	return items;
}

obj.getRoomsForAutocomplete = function(stateGroupId) {
	var rooms = this.getRooms();
	var items = [];
	if (rooms != null)
		for (var idx = 0; idx < rooms.length; idx++)
			if ((stateGroupId == null) || (stateGroupId == rooms[idx].stateGroupId))
				items[items.length] = {
					roomId: rooms[idx].id,
					name: rooms[idx].description
				};
	return items;
}

obj.getStatesForAutocomplete = function(stateGroupId) {
	var states = this.getStates();
	var items = [];
	if (states != null)
		for (var idx = 0; idx < states.length; idx++)
			if ((stateGroupId == null) || (stateGroupId == states[idx].stateGroupId))
				items[items.length] = {
					stateId: states[idx].id,
					name: states[idx].description
				};
	return items;
}

obj.getTriggerableActionsForAutocomplete = function(stateGroupId) {
	var actions = this.getActions();
	var items = [];
	if (actions != null)
		for (var idx = 0; idx < actions.length; idx++)
			if (actions[idx].isTriggerable && ((stateGroupId == null) || (stateGroupId == actions[idx].stateGroupId)))
				items[items.length] = {
					actionId: actions[idx].id,
					name: actions[idx].description
				};
	return items;
}

obj.getPerformableActionsForAutocomplete = function(stateGroupId) {
	var actions = this.getActions();
	var items = [];
	if (actions != null)
		for (var idx = 0; idx < actions.length; idx++)
			if (actions[idx].isPerformable && ((stateGroupId == null) || (stateGroupId == actions[idx].stateGroupId)))
				items[items.length] = {
					actionId: actions[idx].id,
					name: actions[idx].description
				};
	return items;
}

module.exports = StateControl;

String.prototype.normalize = function(){
	var str = this;
	if (str == null)
		str = '';
	return str.trim().toLowerCase();
}

String.prototype.startsWith = function(text){
	if ((this == null) || (text == null) || (this.length == 0) || (text.length == 0)) return false;
	if (this.indexOf(text) >= 0) return true;
	return false;
}

