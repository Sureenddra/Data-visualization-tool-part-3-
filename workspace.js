var d3, fileData, entities = {};

var openFiles = [];

/**
 * These are the entities that will be shown. You can add or remove entities found in the TSV to customise this list.
 */
var selectedEntities = [
	{ key: 'PERSON', display: 'Person'},
	{ key: 'DATE', display: 'Date'},
	{ key: 'ORG', display: 'Organisation'}
];

var selectedEntitiesKeys = selectedEntities.map(function (cluster) {
	return cluster.key;
});

/**
 * Function called when body is loaded
 */
function init() {
	readFiles();
}

/**
 *  Initial sortable elements
 */
function initSort() {

	$(".sortable")
		.sortable()
		.disableSelection();

	$(".sortable-row")
		.sortable({
			tolerance: "pointer"
		})
		.disableSelection();

	$("#sortable li").on('click', function(){
		var fileId = $(this).attr('id').replace('item-', '');
		openFile(fileId);
	});

	$("#close-all").on('click', function(){
		openFiles = [];
		updatedSelected();
		$('#containment-wrapper').empty();
	});

	updateDraggables();

}

/**
 * Read the files using d3 and save the data in a array.
 *
 * Add the files to the document browser list and allow them to be sortable.
 *
 */
function readFiles() {

	d3.tsv("Datasets/documents_clustered.tsv").then(function(data) {
		fileData = data;

		data.forEach(function (file) {
			file.entities = JSON.parse(file.entities);

			for(var key in file.entities){
				if (selectedEntitiesKeys.indexOf(key) === -1) {
					delete file.entities[key];
				} else {

					if (Object.keys(entities).indexOf(key) === -1) {
						entities[key] = [];
					}
					entities[key].push(file.id);
				}
			}

		});

		selectedEntities.forEach(function (entity) {

			// set up each element
			var column = $('<div class="col-4 p-0"></div>');
			var header = $('<h5>'+entity.display+'<span class="handle ui-icon ui-icon-arrowthick-2-e-w"></span></h5>');

			var button = $('<span class="btn btn-primary mb-1">Open all</span>').on('click', function () {
				entities[entity.key].forEach(openFile);
			});
			var block = $('<ul id="sortable-block-' + entity.key  +'" class="sortable"></ul>');

			// add them to the document browser
			$("#sortable").append(column.append(header, button, block));

			// add each file to the entity column
			entities[entity.key].forEach(
				function(fileId){
					block.append(
						$('<li class="item-'+fileId+' ui-state-default" id="item-'+fileId+'">' +
							'<span class="handle ui-icon ui-icon-arrowthick-2-n-s"></span>'+fileId+
						'</li>'))
				});
		});

		initSort();
	});

	d3.tsv("Datasets/documents_entity_tfidf.tsv").then(function(data) {
		var  el = d3.select("#mds");
		d3scatterplot(el, data);

	});
}

/**
 * open the given fileId in the workspace
 * @param fileId
 */
function openFile(fileId) {
	if(openFiles.indexOf(fileId) === -1) {
		openFiles.push(fileId);
		$('#containment-wrapper').append(documentTemplate(getFileDataById(fileId)));
		updateDraggables();
		updatedSelected();
	}
}

/**
 * Close the given fileId in the workspace
 *
 * @param fileId
 */
function closeFile(fileId) {
	openFiles = openFiles.filter(function (id) {
		return id !== fileId.replace('card-', '');
	});
	updatedSelected();
}

/**
 * Return file from file data array by id
 *
 * @param id
 * @returns file
 */
function getFileDataById(id){
	return fileData.filter(function (file) {
		return file.id === id;
	})[0];
}

/**
 * Get the pills as template to show the entities a document contains.
 *
 * @param file
 * @returns {string}
 */
function fileClusterPillsTemplate(file) {
	return Object.keys(file.entities).map(
		function (key) {
			return '<span class="badge badge-secondary">' + key + '</span></h2>'
		}
	).join(' ');
}

/**
 * Template for the card in the document workspace
 *
 * @param file
 * @returns {string} html string
 */
function documentTemplate(file) {
	return '<div id="card-'+ file.id+ '" class="card draggable ui-widget-content w-50">' +
		'<p class="card-header">'+ file.id + '<span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></p>' +
		'<p class="card-body">'+ file.content + '</p>' +
		'<p class="card-footer">'+ fileClusterPillsTemplate(file) + '</p>' +
	'</div>'
}

/**
 *  Function for initiating draggables in the document workspace.
 */
function updateDraggables() {
	$(".draggable").draggable({ containment: "#containment-wrapper" });

	$(".draggable").on( "click", "span.ui-icon-close", function() {
		var fileId = $( this ).closest( "div" ).attr('id').replace('card-', '');
		$( this ).closest( "div" ).remove();
		closeFile(fileId);
	});
}

/**
 * Updated the selected items in the list using the ids in the open files
 */
function updatedSelected() {
	$(".sortable li").removeClass('selected');
	$(openFiles.map(function (id) {
		return '.item-' + id
	}).join(',')).addClass('selected')
}

/**
 * Updated the selected items in the list using the ids in the open files
 */
function updatedHovered(id) {
	$(".sortable li").removeClass('hover');
	if (id) {
		$('.item-' + id).addClass('hover')
	}
}


/**
 *  Generate a scatter plot given the  element to put this in and the data
 *
 * @param el
 * @param data
 */

var d3scatterplot = function(el, data) {

	var margin = {top: 20, right: 20, bottom: 30, left: 40},
		width = 400 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom,
		radius = 3;


	data.forEach(function(d) {
		d.x = +d.x;
		d.y = +d.y;
	});

	// create initial element g
	var svg = el.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


	// setup x
	var xValue = function(d) { return d.x },
		xScale = d3.scaleLinear().range([0, width]), // value -> display
		xAxis = d3.axisBottom(xScale);

	// setup y
	var yValue = function(d) { return d.y }, // data -> value
		yScale = d3.scaleLinear().range([height, 0]), // value -> display
		yAxis = d3.axisLeft(yScale);

	xScale.domain(d3.extent(data, xValue)).nice();
	yScale.domain(d3.extent(data, yValue)).nice();


	// create the labels
	var labels = svg.selectAll(".labels")
		.data(data).enter()
		.append("text")
		.attr("class", "label")
		.attr("x", function(d) {return xScale(d.x);})
		.attr("y", function(d) {return yScale(d.y);})
		.text(function(d) {return d.id;})
		.attr("font-size",10)
		.attr("id",function(d,i) {return "label" + i});


	// add the data points

	var dots = svg.selectAll(".datapoint")
		.data(data).enter()
		.append("circle")
		.attr("class", "datapoint")
		.attr("cx", function (d) {
			return xScale(d.x)
		})
		.attr("cy", function(d) {
			return yScale(d.y)
		})
		.attr("id",function(d,i) {return "point" + i})
		.attr("r", radius)
		.on("mouseover", handleMouseOver)
		.on("mouseout", handleMouseOut)
		.on("click", handleMouseClick);

	svg.append("g").call(xAxis)
		.attr("class", "axis")  //Assign "axis" class
		.attr("transform","translate(0," + height + ")");

	svg.append("g").call(yAxis)
		.attr("class", "axis");



	// Create Event Handlers for mouse
	function handleMouseOver(d) {
		// Use D3 to select element, change color and size
		d3.select(this).attrs({
			fill: "orange",
			r: radius * 2
		});

		updatedHovered(d.id)
	}

	function handleMouseOut(d) {

		// Use D3 to select element, change color back to normal
		d3.select(this).attrs({
			fill: "black",
			r: radius
		});

		updatedHovered();
	}

	function handleMouseClick(d) {
		openFile(d.id);
	}

};

