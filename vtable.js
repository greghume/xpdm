/*
//
//
//
*/
//  vtable column properties 
//  label:  string
//  renderer: string name of function - *_renderer
//  width: string, e.g. '40pt'
//

const vtable = {

    ptindex: 1,
    columns: [ { label: "#" , width: '40pt'} ],
    cursor: 0,
    rowCursor: 0,
    columnCursor: 0,
    cid: 0,
    data: [],
    filterChain: null,
    collection: null,
    container: 'section.outer-table',

    // 
    // 
    //

    buildtable: function() {

	const ot = document.querySelector(this.container);
	console.log("ALL", ot.querySelectorAll( '.outer-table>div'));

	[...ot.querySelectorAll( '.outer-table>div')].forEach( x => x.remove());
    
	// Remove existing elements
	//let existingTable = ot.querySelector('table');
	//if (existingTable != undefined && existingTable != null) {
	    //existingTable.remove();
	    //ot.querySelector('.vsb').remove();
	    //ot.querySelector('.hsb').remove();
	//}

	// Create table wrapper and table first
	let tableWrapper = document.createElement('div');
	tableWrapper.classList.add('table-wrapper');
    
    // Create table and add to wrapper
    
    let tbl = document.createElement('table');
    tableWrapper.appendChild(tbl);
    
    // Build the scrollbars
    // =====================================================================================================
    // VERTICAL SCROLLBAR
    // =====================================================================================================

    let vsb = document.createElement('div');
    vsb.dataset.min = 0;
    vsb.dataset.max = this.data.length;
    vsb.classList.add('vsb');

    let vtrack = document.createElement('div');
    let vthumb = document.createElement('div');
    vtrack.classList.add('vtrack');
    vthumb.classList.add('vthumb');

    // Calculate thumb height based on visible rows vs total rows
    const visibleRows = Math.floor((ot.clientHeight - 40) / 16); // 40px for header, 16px per row
    const thumbHeight = Math.max(20, Math.min(vtrack.clientHeight * (visibleRows / vtable.data.length), vtrack.clientHeight));
    vthumb.style.height = thumbHeight + 'px';

    // Add drag functionality to vertical thumb
    let isVDragging = false;
    let startY = 0;
    let startTop = 0;

    vthumb.addEventListener('mousedown', function(e) {
        isVDragging = true;
        startY = e.clientY;
        startTop = vthumb.offsetTop;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isVDragging) return;
        
        e.preventDefault();
        const deltaY = e.clientY - startY;
        const maxThumbTop = vtrack.clientHeight - vthumb.clientHeight;
        const newTop = Math.max(0, Math.min(startTop + deltaY, maxThumbTop));
        vthumb.style.top = newTop + 'px';
        
        // Calculate and update table position based on thumb position ratio
        const ratio = newTop / maxThumbTop;
        const newPosition = Math.floor(ratio * vtable.data.length);
       	vtable.redrawTableFrom(newPosition, vtable.columnCursor);
    });

    document.addEventListener('mouseup', function() {
        if (isVDragging) {
            isVDragging = false;
        }
    });

    // add vertical track and thumb to the vscroll wrapper.
    vtrack.appendChild(vthumb);
    vsb.appendChild(vtrack);
    // Add click handler for vertical track

    vtrack.onclick = function(e) {
        // Calculate the new thumb position based on click
        const clickY = e.offsetY;
        const trackHeight = vtrack.clientHeight;
        const thumbHeight = vthumb.clientHeight;
        
        // Calculate new thumb position, accounting for thumb height
        const maxThumbTop = trackHeight - thumbHeight;
        const newTop = Math.min(Math.max(0, clickY - (thumbHeight / 2)), maxThumbTop);
        vthumb.style.top = newTop + 'px';
        
        // Calculate and update table position
        const ratio = newTop / maxThumbTop;
        const newPosition = Math.floor(ratio * vtable.data.length);
       	vtable.redrawTableFrom(newPosition, vtable.columnCursor);
    }


    // Add wheel event handler for vertical scrolling
    tableWrapper.addEventListener('wheel', function(e) {
	e.preventDefault(); 
    
	// Move exactly 3 rows at a time, regardless of wheel delta
	//const scrollAmount = Math.sign(e.deltaY) * 3; // Always move 3 rows
	const scrollAmount = Math.round(e.deltaY/100) * 3; // Always move 3 rows

	console.log(e.deltaY, vtable.cursor, scrollAmount);
    
	// Get current cursor position
	let newCursor = (vtable.cursor - vtable.numberOfRows) + scrollAmount;
	    if( newCursor<0) newCursor = 0;
	    else if (newCursor + vtable.numberOfRows > vtable.data.length) newCursor = vtable.data.length-vtable.numberOfRows;
    
	// Update cursor position based on scroll direction
	/*
	if (scrollAmount > 0) {
	    // Scrolling down
	    console.log( 'down', newCursor, vtable.cursor);
	} else if (scrollAmount < 0) {
	    // Scrolling up
	    newCursor = Math.max(0, vtable.cursor - 3);
	    console.log( 'up', newCursor, vtable.cursor);
	}
	*/
    
	// Only update if position changed
	if (newCursor !== vtable.cursor) {
	    // Update thumb position
	    const maxThumbTop = vtrack.clientHeight - vthumb.clientHeight;
	    const ratio = newCursor / vtable.data.length;
	    const newThumbTop = Math.floor(ratio * maxThumbTop);
	    vthumb.style.top = newThumbTop + 'px';
	    
	    // Redraw table from new position
	    vtable.redrawTableFrom(newCursor, 0);
	}
    }, { passive: false }); // passive: false to allow preventDefault


    // =====================================================================================================
    // HORIZONTAL SCROLLBAR
    // =====================================================================================================

    // Build horizontal scrollbar
    let hsb = document.createElement('div');
    hsb.dataset.min = 0;
    hsb.dataset.max = this.columns.length;
    hsb.classList.add('hsb');

    let htrack = document.createElement('div');
    let hthumb = document.createElement('div');
    htrack.classList.add('htrack');
    hthumb.classList.add('hthumb');

    // Calculate thumb width based on visible columns vs total columns
    const visibleColumns = Math.floor((ot.clientWidth - 40) / 100); // 40px for first column, ~100px per column
    const thumbWidth = Math.max(20, Math.min(htrack.clientWidth * (visibleColumns / this.columns.length), htrack.clientWidth));
    hthumb.style.width = thumbWidth + 'px';

    // Add drag functionality to horizontal thumb
    let isHDragging = false;
    let startX = 0;
    let startLeft = 0;

    hthumb.addEventListener('mousedown', function(e) {
        isHDragging = true;
        startX = e.clientX;
        startLeft = hthumb.offsetLeft;
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isHDragging) return;
        
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const maxThumbLeft = htrack.clientWidth - hthumb.clientWidth;
        const newLeft = Math.max(0, Math.min(startLeft + deltaX, maxThumbLeft));
        hthumb.style.left = newLeft + 'px';
        
        // Calculate and update visible columns based on thumb position ratio
        const ratio = newLeft / maxThumbLeft;
        const maxColumnOffset = Math.max(0, this.columns.length - visibleColumns);
        const newColumnPosition = Math.floor(ratio * maxColumnOffset);
       	vtable.redrawTableFrom(vtable.cursor, newColumnPosition);
    }.bind(this));

    document.addEventListener('mouseup', function() {
        if (isHDragging) {
            isHDragging = false;
        }
    });

    // Add click handler for horizontal track
    htrack.onclick = function(e) {
        if (e.target === hthumb) return; // Don't handle clicks on the thumb itself
        
        const clickX = e.offsetX;
        const trackWidth = htrack.clientWidth;
        const thumbWidth = hthumb.clientWidth;
        
        // Calculate new thumb position, centering it on the click point
        const maxThumbLeft = trackWidth - thumbWidth;
        const newLeft = Math.min(Math.max(0, clickX - (thumbWidth / 2)), maxThumbLeft);
        hthumb.style.left = newLeft + 'px';
        
        // Calculate and update visible columns based on thumb position ratio
        const ratio = newLeft / maxThumbLeft;
        const maxColumnOffset = Math.max(0, this.columns.length - visibleColumns);
        const newColumnPosition = Math.floor(ratio * maxColumnOffset);
        this.redrawTableFrom(vtable.cursor, newColumnPosition);
    }.bind(this);

    htrack.appendChild(hthumb);
    hsb.appendChild(htrack);

    hsb.onclick = function(e) {

	let x = e.offsetX
	let t = e.srcElement.parentNode.querySelector('table')
	let w = e.srcElement.clientWidth
	let m = vtable.columns.length

	let c = Math.floor( (x/w) * m )

	console.log('m,w,x,c',m,w,x,c)

	vtable.redrawTableFrom( vtable.cursor, c);

    }

    // =====================================================================================================
    // BUILD OT
    // =====================================================================================================

    // Create spacer for bottom right corner
    let xsb = document.createElement('div');
    xsb.classList.add('xxb');

    ot.appendChild(tableWrapper);
    ot.appendChild(vsb);
    ot.appendChild(hsb);
    ot.appendChild(xsb);

    // =====================================================================================================
    // BUILD OT
    // =====================================================================================================

    // add scrollbar event handlers 

    hsb.oninput = function(e) { }


    // 
    // table listeners
    // 

	// select cell 

	tbl.addEventListener("mousedown", e => { 

	    if(e.button != 0 || e.composedPath()[0].nodeName != "TD") return;
	    tbl.querySelectorAll('td.selected-cell').forEach( r => r.classList.remove('selected-cell') )
	    e.composedPath()[0].classList.add('selected-cell')

	})

	tbl.addEventListener("mouseup", e => {

	    if(e.button != 0 || e.composedPath()[0].nodeName != "TD") return;

	    tbl.querySelectorAll('td.selected-cell').forEach( r => r.classList.remove('selected-cell') )
	    //e.composedPath()[0].classList.remove('selected-cell')
	})


	tbl.addEventListener("contextmenu", e => { 


	    let targetCell = null;
	    for(var ii in e.composedPath()) { if( e.composedPath()[ii].nodeName == 'TD') targetCell = e.composedPath()[ii] }

	    if(targetCell == null) return; 

	    let rid = targetCell.parentNode.rowIndex;

	    let cid = targetCell.cellIndex;
	    let val = targetCell.innerText;
	    let colobj = targetCell.parentNode.parentNode.rows[0].cells[cid]
	    let col = colobj.innerText


	    document.querySelectorAll('.current-context-element').forEach( r => r.classList.remove('current-context-element'));
	    e.composedPath()[0].classList.add('current-context-element');
	    e.preventDefault();

	    const menu = document.querySelector("div.context-menu");

	    menu.innerHTML = cellContextMenu;
	    if (rid == 0) { menu.innerHTML = columnContextMenu; menu.querySelector('div').innerText = val.split('\\n')[0]; }
	    if (cid == 0) menu.innerHTML = rowContextMenu
	    menu.dataset.rowindex = rid
		
	    const command = "show";
	    menu.style.left = `${e.pageX}px`;
	    menu.style.top = `${e.pageY}px`;
	    menu.style.display = command === "show" ? "block" : "none";

	    if( menu.querySelector('.render-as-text') )  menu.querySelector('.render-as-text').onclick =  function () { 
		vtable.columns.find( c => c.label == col).renderer = 'text_renderer'
		vtable.cursor = 0
		vtable.redrawTableFrom(0,0);
	    }

	    if( menu.querySelector('.render-as-url') )  menu.querySelector('.render-as-url').onclick =  function () { 
		vtable.columns.find( c => c.label == col).renderer = 'url_renderer'
		vtable.cursor = 0
		vtable.redrawTableFrom(0,0);
	    }

	    if( menu.querySelector('.popup-row-details') )  menu.querySelector('.popup-row-details').onclick =  function (e) { 
		let rowval = e.srcElement.parentElement.parentElement.dataset.rowindex
		let rowIndex = new Number(rowval)
		console.log( vtable.getRow(rowIndex))
	    }

	    //if( menu.querySelector('#filter-on-me') )  menu.querySelector('#filter-on-me').onclick =  function () { self.runEqFilter(col, val, true); }
	    //if( menu.querySelector('#filter-not-me') ) menu.querySelector('#filter-not-me').onclick = function () { self.runNotEqFilter(col, val); }
	    //if( menu.querySelector('.build-a-chart') ) menu.querySelector('.build-a-chart').onclick = function () { self.buildAChartFor(col, val); }
	    //if( menu.querySelector('.open-filter-panel') ) menu.querySelector('.open-filter-panel').onclick = function (e) { 
		//self.showColumnFilter(self,colobj,{clientX:e.clientX,clientY:e.clientY})
	    //}

	    //if( menu.querySelector('.build-a-column-chart') ) menu.querySelector('.build-a-column-chart').onclick = function () { 
		//let hcol = targetCell.parentNode.innerText
	    	//self.buildAChartFor(val, val); 
	    //}
	    return false;
	});


	// setup resize observer 

	const resizeObserver = new ResizeObserver( entries => {

	    for (let entry of entries) { 

		if(entry.contentBoxSize) {

		    let xh = tbl.clientHeight;
		    let nh = entry.contentRect.height;
		    let rowheight = tbl.rows[0].clientHeight;

		    console.log('entry',rowheight, entry);
		    let diff = Math.floor((ot.clientHeight - tbl.clientHeight) / rowheight); 

		    if(diff>0) { 

			console.log('diff',diff, tbl.rows.length);

			if( this.cursor < this.data.length) {

			    row = tbl.insertRow(tbl.rows.length);

			    row.classList.add("bodyrow");

			    this.columns.forEach( c => {
				let cell = row.insertCell(row.cells.length);
				cell.innerText = (c.label == '#') ? this.cursor+1 : this.data[this.cursor][c.label];
			    });

			    this.cursor++;
			}
		    }
		    if(diff<0) {
			this.cursor--;
			tbl.rows[tbl.rows.length-1].remove();
		    }
		} 

	    }
	});

	resizeObserver.observe(ot);

	window.onresize = function(x) {
	    console.log('win-resize',x);
	    vtable.buildtable();
	    vtable.redrawTableFrom(vtable.rowCursor, vtable.columnCursor);
	}


	// -------
	// populate the inner-table 

	console.time('build-inner-table')

	tbl.style.width= '200%';
	tbl.style.height= '40px';

	// add heading row
	// only one heading row

	let row = tbl.insertRow();
	row.classList.add("heading");

	//for( nn in columns) {
	    //const column = columns[nn];
	    //const cell = row.insertCell( row.cells.length);
	    //cell.classList.add( "colhead" );
	    //cell.setAttribute( "id", 'col' + nn);
	//}

	let nn = 0;
	this.columns.forEach( c => {
	    let cell = row.insertCell(row.cells.length);
	    cell.classList.add("colhead");
	    cell.classList.add('col' + nn);
	    nn++;

	    if( row.cells.length == 1) 

		cell.innerHTML = `<div class="x"> ${c.label}</div>`

	    else {

		cell.innerHTML = `
		    <div class="x"> ${c.label}
		      <div class="y"> </div>
		    </div>
		`;

		if( c.width != undefined && c.width != null) { 
		//console.log('c',c.label,c.width)
		}
	    }
	});



	// add on as many rows of data as you can.

	let colmap = [];
	[...row.cells].forEach( c => colmap.push( [c.scrollWidth, c.offsetWidth, c.offsetLeft, tbl.clientWidth] ) );
	

	for(kk=0;kk<60;kk++) { 

	    if( row.offsetHeight + row.offsetTop <= (tbl.parentElement.clientHeight-40)) {
		if( this.cursor+1 < this.data.length) {
		    this.cursor++;
		    row = tbl.insertRow();
		    row.classList.add("bodyrow");

		    for( cx in vtable.columns) {
			let c = vtable.columns[cx];
			let cell = row.insertCell(row.cells.length);
			cell.classList.add('col'+cx);
			let value = this.data[this.cursor][c.label] 

			// 
			// add renderers - there is no default renderer
			// 

			if( c.renderer == undefined || c.renderer == null) {

			    cell.innerHTML = (c.label == '#') ? this.cursor : value

			} else {

			    // renderValueWith(rendererName,value,datarow)

			    switch( c.renderer ) {

				case 'text_renderer': 
				    cell.innerText = value
				    break;

				case 'date_renderer': 
				   let d = new Date(value)
				    cell.innerText = d
				    break;

				case 'url_renderer': 
				   console.log('tourl',value);
				   let stub = (c.stub) ? c.stub : ' 📄  '
				    cell.innerHTML = (value != null && value != "null" ) ? '<a target="_new" href="'+value+'">' + stub +  '</a>' : value;
				    break;

				case 'list_renderer': 
				    cell.innerHTML = (value != null && value != "null" ) ? '<a href="#">' + value + '</a>' : value;
				    break;

				case 'attribute_renderer': 

				    if(value == null || value == "null") cell.innerHTML = value;

				    else {

					let x = (value) ? value.split('.') : [];

					if (x.length == 2) { 
					    cell.innerHTML = `<u>${x[0]}</u> | <u>${x[1]}</u>`;
					}
					else { 
					    cell.innerHTML = `<u>${value}</u>`;
					    cell.classList.add('rosy')
					}
				    }
				    break;
				default:
				    cell.innerHTML = c.renderer
				    break;
			    }
			}
		    };
		}
	    }
	}

	//console.timeEnd('build-inner-table')
    
	// keydown listen on document should be constrained to active table if any. 

	document.addEventListener("keydown", e => { 

	    if (e.key == 'PageDown')	vtable.pageDownTable();
	    if (e.key == 'PageUp')	vtable.pageUpTable();
	    if (e.key == 'ArrowDown')	vtable.scrollDownTable(1);
	    if (e.key == 'ArrowUp')  	vtable.scrollUpTable(1);
	});


	// 
	// add column header event handlers: sort up/down & filter
	//

	const self = this;

	// skip the first column because it's the row number header

	[...document.querySelectorAll('.colhead')].slice(1).forEach ( ch => {

	    ch.onclick = function(){ 

		console.log('sort', ch.dataset.sortedDown)

	    	if( ch.dataset.sortedDown == 'true') {
		    self.sortUp(ch) 
		} else {
		    self.sortDown(ch) 
		}

		ch.dataset.sortedDown = (ch.dataset.sortedDown == 'true') ? 'false' : 'true';
	    }

	    // add sorted indicator

	    //ch.querySelector('.y button.dn').onclick = function(){ self.sortDown(ch) }
	    //ch.querySelector('.y button.up').onclick = function(){ self.sortUp(ch) }
	    //ch.querySelector('.y button.fltr').onclick = function(e){ self.showColumnFilter(self,ch,e) }

	}) 

	// add resize controls to the column headers 

	vtable.resizableGrid(tbl);
	vtable.table = tbl;
	vtable.numberOfRows = tbl.rows.length;
	console.timeEnd('build-inner-table')
    },

    //
    //
    //

    getRow( n) {

    	let tbl = document.querySelector(this.container).querySelector('table')
	let idx = this.cursor
	let rid = n

	console.log( tbl.rows[n].innerText )
	let xwin = document.createElement('x-win')
	xwin.classList.add('popup-row-details')
	xwin.dataset.label = 'Row ' + n + ' of ' + vtable.collection.name


	let txt = '<div class="head">'+xwin.dataset.label+'</div><ul>'
	Object.keys(this.data[idx]).forEach ( k => txt += '<li><label>'+k+'</label><span>' + this.data[idx][k] +'</span></li>')
	txt += '</ul>'

	//https://api.box.com/2.0/files/%7BFileID%7D/content



	let form = document.createElement('div')
	form.setAttribute('slot','content')
	form.classList.add('record-details-form')
	form.innerHTML = txt
	xwin.appendChild(form)
	document.body.appendChild(xwin)
	xwin.raise()

	console.log( this.data[idx] )
    },

    //
    // applyTransform (tx)
    // 1. --- 
    // 3. generate a new dataset by running the transform 
    // 4. save the transform in the currentTransforms chain.
    // 5. rebuild (redraw?) the table.

    //applyTransform (tx) {
	//this.initFilterChain()
	//this.data = this.filterChain.transform([tx]).data({removeMeta:true})
	//this.currentTransforms.push(tx)
	//this.cursor = 0;
	//this.buildtable();
	//console.log("OK");
    //},

    //
    // column value filters
    //

    //runNotEqFilter (fn,val, flag) { this.applyTransform( { type: 'find', value:{ [fn]: { '\$ne': val    } } } ) },
    //runInFilter (fn,values,flag)  { this.applyTransform( { type: 'find', value:{ [fn]: { '\$in': values } } } ) },
    //runEqFilter (fn,val,flag) 	  { this.applyTransform( { type: 'find', value:{ [fn]: { '\$eq': val    } } } ) },


    // 
    // showColumnManager
    // column manager panel
    // contains: #, column name, hide, show, resize, renderer 
    //

    showColumnManager(refel) {

	let cmp = document.createElement('div')

	let nn = 0;
	let dname = vtable.collection.name
	let hdr = `
		<div class="column-manager-heading">
		  <span>${dname}</span>
		  <span class="buttonbar">
		    
		    <button class="dropbtn">Views &#9660;</button> 

		    <button class="dropbtn">Save...</button>
		    <button class="heading-button">Invert</button>
		    <button class="heading-button">Reset</button>
		    <button class="heading-button">Appy</button>
		    <button class="heading-button">Copy</button>
		  <span>
		</div>
		<ul class="column-list"><li>`

	cmp.innerHTML = hdr + this.columns.map( c => {
		//let rstr = c.renderer ? '<span class="renderer">'+c.renderer+'</span>' : '<span class="renderer"></span>'
		let rstr =  '<span class="renderer"></span>'
		return '<span class="gap"></span><span class="num">' + (nn++) +'</span><span class="lum">'+c.label+'</span>' + rstr

	    }).join('</li><li>') + '</li></ul>'

	cmp.classList.add('column-manager-panel')

	cmp.setAttribute('slot','content')

	cmp.addEventListener( "contextmenu", e => { 

	    e.preventDefault();

	    let rid = 0
	    let col = e.srcElement.innerText;

	    //let colobj = 

	    document.querySelectorAll('.current-context-element').forEach( r => r.classList.remove('current-context-element'));
	    e.composedPath()[0].classList.add('current-context-element');

	    const menu = document.querySelector("div.context-menu");

	    menu.innerHTML = columnContextMenu;
	    menu.querySelector('div').innerText = col

	    let colobj = vtable.columnByName(col)
		
	    const command = "show";
	    menu.style.left = `${e.pageX}px`;
	    menu.style.top = `${e.pageY}px`;
	    menu.style.display = command === "show" ? "block" : "none";

	    if( menu.querySelector('.render-as-text') )  menu.querySelector('.render-as-text').onclick =  function () { 
		vtable.columns.find( c => c.label == col).renderer = 'text_renderer'
		vtable.cursor = 0
		vtable.buildtable();
	    }
	
	    if( menu.querySelector('.render-as-url') )  menu.querySelector('.render-as-url').onclick =  function () { 
		vtable.columns.find( c => c.label == col).renderer = 'url_renderer'
		vtable.cursor = 0
		vtable.buildtable();
	    }


	    if( menu.querySelector('.build-a-chart') ) menu.querySelector('.build-a-chart').onclick = function () { self.buildAChartFor(col, val); }

	    if( menu.querySelector('.open-filter-panel') ) menu.querySelector('.open-filter-panel').onclick = function (e) { 
		vtable.showColumnFilter(vtable,colobj,{clientX:e.clientX,clientY:e.clientY})
	    }

	    if( menu.querySelector('.build-a-column-chart') ) menu.querySelector('.build-a-column-chart').onclick = function () { 
	    	vtable.buildAChartFor(col, col); 
	    }

	    return false;
	})

	Array.from(cmp.querySelectorAll('.lum')).forEach( r => r.onclick = function(e) { 

		let colname = e.srcElement.innerText; 
		let colindx = e.srcElement.parentElement.querySelector('.num').innerText
		
		e.srcElement.classList.toggle('notshow') 

		let table = document.querySelector(vtable.container).querySelector('table');

		let oldstate = table.rows[0].cells[colindx].style.display
		let newstate = (oldstate == 'none') ? '' : 'none'

		Array.from(table.rows).forEach( r =>  r.cells[colindx].style.display = newstate )

	})

	let pop = document.createElement('x-win')

	pop.classList.add('column-manager-popup')
	pop.dataset.label = 'COLUMN MANAGER'
	pop.appendChild(cmp)

	let x = 400
	pop.style.left =  (refel.offsetLeft-x) + "px"

	// 

	document.body.appendChild(pop)
	
    },

    // fetch a column object 

    columnByName(col) {

	let x = document.querySelector(vtable.container)
	let y = x.querySelector('table')
	let z = Array.from(y.rows[0].cells).find( c =>  c.innerText == col)
	return z
    },

    //
    // sort by column name
    //

    sortUp: function (col) {

	    //console.log('upthis',this);
	    let colname = col.innerText.split('\\n')[0];
	    let collection = db.collections[this.cid];

	    if(this.filterChain == null) 
	    this.filterChain = db.collections[ this.cid ].chain()

	    //let filteredCollection = collection.chain().find({}).simplesort(colname)
	    let filteredCollection = this.filterChain.find({}).simplesort(colname)
	    let docArray = filteredCollection.data();

	    this.cursor = 0;
	    this.filteredCollection = filteredCollection;
	    this.data = docArray;
	    this.redrawTableFrom(0,0);
    },


    sortDown: function (col) {
    },

    redrawTableFrom: function(nn, cc) {

	    const ds = vtable.data;
	    const tbl = document.querySelector('table');
	    const len = tbl.rows.length;
	    const ot = document.querySelector(vtable.container);
	    const visibleColumns = Math.floor((ot.clientWidth - 40) / 100); // 40px for first column, ~100px per column	// MAGIC NUMBER

	    requestAnimationFrame(function() {

		vtable.cursor = (nn < 0) ? 0 : nn;
		
		// First, ensure all cells exist and are properly structured

		for(let kk = 0; kk < len; kk++) {

		    let trow = tbl.rows[kk];
		    let drow = kk === 0 ? null : ds[Math.min(vtable.cursor + (kk-1), ds.length-1)];
		    
		  //console.log('DRROW', kk, drow);

		    // Skip cursor increment for header row
		    if(kk > 0) vtable.cursor++;
		    
		    // Ensure we have enough cells for all columns
		    while(trow.cells.length < vtable.columns.length) {
			trow.insertCell();
		    }
		    
		    // Process each column
		    vtable.columns.forEach((c, colIndex) => {
			let cell = trow.cells[colIndex];
			
			// Set visibility based on column offset
			//if(colIndex < cc || colIndex >= cc + visibleColumns) {
			    //cell.style.display = 'none';
			    //console.log('invisible', colIndex);
			    //return;
			//}
			
			cell.style.display = '';
			
			// For header row
			if(kk === 0) {
			    if(!cell.classList.contains('colhead')) {
				cell.classList.add('colhead');
				cell.innerHTML = `<div class="x">${c.label}</div>`;
			    }
			    return;
			}
			
			// For data rows
			let val = (c.label == '#') ? (vtable.cursor) : drow[colIndex];
			cell.innerHTML = vtable.renderCell(c, val).html;
		    });
		}
	    });
	},

    renderCell: function (c,value) {

	let x = ''
	let z = ''

	if( c.label == '#') return {html: value};

	switch( c.renderer) {

	    default: x = value
	    break

	    case 'text_renderer': 
		x = value
		break;

	    case 'date_renderer': 
	       let d = new Date(value)
		x = d
		break;

	    case 'url_renderer': 
	       let stub = (c.stub) ? c.stub : ' 📄  '
		x = (value != null && value != "null" ) ? '<a target="_new" href="'+value+'">' + stub +  '</a>' : value;
		break;

	    case 'list_renderer': 
		x = (value != null && value != "null" ) ? '<a href="#">' + value + '</a>' : value;
		break;

	    case 'attribute_renderer': 

		if(value == null || value == "null") x = "";

		else {

		    let k = (value) ? value.split('.') : [];


		    if (k.length == 2) { 

			x = `<u>${k[0]}</u> | <u>${k[1]}</u>`; }

		    else { 
			x = `<u>${value}</u>`;
			z = 'rosy'
		    }
		}
		break;
	}
	return { html:x, style:z} 
    },


scrollUpTable: function  (nn) {
    this.redrawTableFrom( (vtable.cursor - vtable.numberOfRows) - nn , vtable.columnCursor );
},

scrollDownTable: function  (nn) {
    this.redrawTableFrom( (vtable.cursor-vtable.numberOfRows) + nn , vtable.columnCursor );
},

pageUpTable: function  () {
    let tbl = document.querySelector('table');
    let tblsize = tbl.rows.length-1;
	console.log(tblsize,vtable.cursor)
    this.redrawTableFrom( vtable.cursor - (2*tblsize), 0 );
},

pageDownTable: function  () { 
    this.redrawTableFrom (vtable.cursor, 0); 
},

resizableGrid: function (table) {
    var row = table.getElementsByTagName('tr')[0],
    cols = row ? row.children : undefined;
    if (!cols) return;
    
    table.style.overflow = 'hidden';
    //table.style.width = 'max-content'; // Ensure table can grow
    //table.style.minWidth = '100%'; // But maintain minimum width
    
    var tableHeight = table.offsetHeight;
    var totalWidth = 0;
    
    // Calculate initial total width
    for (var i = 0; i < cols.length; i++) {
        //totalWidth += cols[i].offsetWidth;
        totalWidth += cols[i].scrollWidth;
    }
    console.log('TOTAL WIDTH', table.offsetWidth, table.scrollWidth, table.clientWidth, table.style.maxWidth, table.style.width, totalWidth);
    table.style.width = totalWidth + 'px';
    
    for (var i = 0; i < cols.length; i++) {
        var div = createDiv(tableHeight);
        cols[i].appendChild(div);
        cols[i].style.position = 'relative';
        cols[i].style.minWidth = cols[i].offsetWidth + 'px'; // Set minimum width
        setListeners(div, cols[i], table);
    }
    
    // 
    function setListeners(div, col, table) {

        var pageX, curCol, nxtCol, curColWidth, nxtColWidth, startTableWidth;
        
        div.addEventListener('mousedown', function(e) {
            curCol = col;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;
            
            var padding = paddingDiff(curCol);
            curColWidth = curCol.offsetWidth - padding;
            //if (nxtCol) {
                //nxtColWidth = nxtCol.offsetWidth - padding;
            //}
            startTableWidth = table.offsetWidth;
        });
        
        div.addEventListener('mouseover', function(e) {
            e.target.style.borderRight = '2px solid #0000ff';
        });
        
        div.addEventListener('mouseout', function(e) {
            e.target.style.borderRight = '';
        });
        
        document.addEventListener('mousemove', function(e) {

            if (curCol) {

                var diffX = e.pageX - pageX;
                
                // Calculate new widths
                var newCurColWidth = curColWidth + diffX;
                
                // Ensure minimum widths
                if (newCurColWidth >= 40 ) {
                    curCol.style.width = newCurColWidth + 'px';
                    
                    // Update table width
                    var newTableWidth = startTableWidth + diffX;
                    table.style.width = newTableWidth + 'px';
                    table.style.maxWidth = (200 + newTableWidth) + 'px';
                    
                    // Update horizontal scrollbar if it exists
		    // FIX THIS
                    var htrack = document.querySelector('.htrack');
                    if (htrack) {
                        var hthumb = htrack.querySelector('.hthumb');
                        if (hthumb) {
                            var maxThumbLeft = htrack.clientWidth - hthumb.clientWidth;
                            var ratio = table.scrollLeft / (newTableWidth - table.parentElement.clientWidth);
                            hthumb.style.left = Math.min(maxThumbLeft, Math.max(0, ratio * maxThumbLeft)) + 'px';
                        }
                    }
                }
            }
        });
        
        document.addEventListener('mouseup', function() {
            curCol = undefined;
            nxtCol = undefined;
            pageX = undefined;
            nxtColWidth = undefined;
            curColWidth = undefined;
            startTableWidth = undefined;
        });
    }
    
    function createDiv(height) {
        var div = document.createElement('div');
        div.style.top = 0;
        div.style.right = 0;
        div.style.width = '5px';
        div.style.position = 'absolute';
        div.style.cursor = 'col-resize';
        div.style.userSelect = 'none';
        div.style.height = height + 'px';
        return div;
    }
    
    function paddingDiff(col) {
        if (getStyleVal(col, 'box-sizing') == 'border-box') {
            return 0;
        }
        var padLeft = getStyleVal(col, 'padding-left');
        var padRight = getStyleVal(col, 'padding-right');
        return (parseInt(padLeft) + parseInt(padRight));
    }
    
    function getStyleVal(elm, css) {
        return (window.getComputedStyle(elm, null).getPropertyValue(css));
    }
},


}	// end vtable def

/*
**
**
*/

// 

//let nn=0


