// Definition of form types
var _formTypes = [
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
		popupWidth: 600,
		source: '_settings.actions',
		filter: { property:'stateGroupId', compareTo:'parentId' },
		listType: 'actions',
		fields: [
			{ property:'description', title:'Omschrijving', isMandatory:true },
			{ property:'isActive', title:'Actief', width:33, propertyType:'boolean', defaultValue:true },
			{ property:'isTriggerable', title:'Is mee te triggeren', width:33, propertyType:'boolean', defaultValue:true },
			{ property:'isPerformable', title:'Is uit te voeren', width:33, propertyType:'boolean', defaultValue:true },
			{ property:'followUps', propertyType:'array' }
		],
		controls: [
			{type:'list', listType:'followUps' }
		]
	},
	{
		type: 'followUp',
		source: 'getActionById(parentId).followUps',
		filter: null,
		listType: 'followUps',
		fields: [
			{ property:'isActive', title:'Actief', width:20, propertyType:'boolean', defaultValue:true },
			{ property:'doNotCheckOverruling', title:'Prioriteit niet respecteren', width:50, propertyType:'boolean', defaultValue:false },
			{ property:'delaySeconds', title:'Delay in seconds', width:30, defaultValue:0 },
			{ property:'stateId', title:'Follow-up state', propertyType:'state' },
			{ property:'actionId', title:'Follow-up action', propertyType:'action' }
		]
	}
];

