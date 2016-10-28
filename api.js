"use strict";
var StateControl = require('./../../lib/state-control.js');
var DEBUG = true;

module.exports = [
	{
		description:			'Get current states for all sections',
		method:					'GET',
		path:					'/section-states/',
		fn: function(callback, args) {
			var result = {
				successful: false,
				errorMessage: '',
				sectionStates: []
			};
			try {
				var stateControl = new StateControl();
				var sections = stateControl.getSections();
				if ((sections == null) || (sections.length == 0)) throw new Error('No sections configured.');
				for (var idx = 0; idx < sections.length; idx++) {
					var state = stateControl.getSectionState(sections[idx]);
					if (state != null) {
						result.sectionStates[result.sectionStates.length] = {
							sectionId: sections[idx].id,
							stateId: state.id
						};
					}
				}
				
				result.successful = true;
			} catch(exception) {
				result.errorMessage = exception.message;
			}
			callback(null, result);
		}
	},
	{
		description:			'Set section state',
		method: 				'POST',
		path:					'/set-section-state/', // ?groupid=&sectionid=&stateid=
		fn: function(callback, args) {
			var result = {
				successful: false,
				errorMessage: ''
			};
			try {
				var groupId = args.query.groupid;
				var sectionId = args.query.sectionid;
				var stateId = args.query.stateid;
				
				if ((groupId == null) || (groupId.length == 0)) throw new Error('No group ID supplied.');
				if ((sectionId == null) || (sectionId.length == 0)) throw new Error('No section ID supplied.');
				if ((stateId == null) || (stateId.length == 0)) throw new Error('No state ID supplied.');
				
				var stateControl = new StateControl();
				var group = stateControl.getGroupById(groupId);
				var section = stateControl.getSectionById(sectionId);
				var state = stateControl.getStateById(stateId);
				
				if (group == null) throw new Error('Could not find group with ID '+groupId+'.');
				if (section == null) throw new Error('Could not find section with ID '+sectionId+'.');
				if (state == null) throw new Error('Could not find state with ID '+stateId+'.');
				
				result.successful = true;
				Homey.app.setSectionState(stateControl, section, state, true);
				
			} catch(exception) {
				result.errorMessage = exception.message;
			}
			callback(null, result);
		}
	},
	{
		description:			'Get settings',
		method: 				'GET',
		path:					'/get-settings/',
		fn: function(callback, args) {
			var result = {
				successful: false,
				errorMessage: '',
				settings: null
			};
			try {
				var stateControl = new StateControl();
				result.settings = stateControl.getSettings();
				result.successful = true;
			} catch(exception) {
				result.errorMessage = exception.message;
			}
			callback(null, result);
		}
	}
];