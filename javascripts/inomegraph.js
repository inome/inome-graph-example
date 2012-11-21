/**
 * @author Nick Rushton (nrushton@intelius.com)
 * @since November 21, 2012
 * @version 1.0
 *
 * holds business logic for inome api graph
 */
function inomeGraph(el){
   var
   /**
    * holds functions which handle click events
    */
   clickHandlers = {person: personClick,
                    multiPreview: multiPreviewClick},
   /**
    * map of node id => bool of nodes which have been previously clicked
    */
   clickedNodes = d3.map();

   /**
    * configuration for our graph
    */
   var config = {
      width: $('#graph').width(),
      height: 700,
      click: click,
      mouseover: mouseover,
      mouseout: mouseout,
      zoomable: true,
      linkStyle: 'arc',
      style: {
                multiPreview: { r: 30 }
             }
   };

   var
      /**
       * graphlib object
       */
      graph = graphLib(el, config),

      /**
       * svg d3 object for selecting elements in our graph
       */
      svg = d3.select('svg');

   /**
    * Augment our graph object with methods that pertain to our business rules
    */

   /**
    * @param json - map of {links: [], nodes: []}
    */
   graph.go = function(data){
     graph.reset();
     graph.setRoot(data.nodes[0]);
     graph.addNodes(data.nodes);
     graph.addLinks(data.links);
     clickedNodes = d3.map();

   } // go()

   /**
    * @param string - type of nodes to hide
    */
   graph.hideType = function(type)
   {
      graph.hide({type:type});

   } // hide()

   /**
    * @param string - type of nodes to un-hide
    */
   graph.showType = function(type)
   {
      graph.show({type:type});

   } // show()

   /**
    * delegates clicking of any node to their type-based click handler
    * @param datum
    */
   function click(r){
      if (r.type in clickHandlers && !clickedNodes.has(r.id))
      {
         getClickHandler(r).apply(this,[r]);

         clickedNodes.set(r.id,r);
      }
   } // click()

   /**
    * retrieves the correct click action for a given node
    * @param datum
    */
   function getClickHandler(r)
   {
      return clickHandlers[r.type];

   } // getClickHandler()

   /**
    * does a new search on the clicked node and populates the graph with new associated nodes
    * @param r - datum clicked
    */
   function personClick(r)
   {
      var self = this;
      startLoadAction(self);
      var params = {
         profileid: r.id,
         api_key: $('form#search-form select, form#search-form input').val()
      };
      getInomeProfiles(params,function(json,data){
         $('#json').html(JSON.stringify(data,null,'  '));
         $('#json').css('background','#DAF4F0').animate({backgroundColor: 'whiteSmoke'},1000);
         prettyPrint();
         var profile = json.profiles[0];
         graph.addNodes(profile.nodes,r);
         graph.addLinks(profile.links);
         endLoadAction(self);
      });
   } // personClick()

   /**
    * handles click of a multiPreview node(one that shows when multiple results occur)
    * does a new search and populates the graph with that profile
    * @param r - datum clicked
    */
   function multiPreviewClick(r)
   {
      graph.option('charge', -150);
      var params = {
         profileid: r.id,
         api_key: $('#api_key select, #api_key input').val()
      }
      getInomeProfiles(params, function(json){
         graph.go(json.profiles[0]);
      });
   } // multiPreviewClick()

   /**
    * @return a list of unclicked nodes
    */
   function getUnclickedNodes()
   {
      var nodes = graph.getNodes();
      return $.map(nodes,function(n,k){
         if (!clickedNodes.has(n.id))
         {
            return n;
         }
      });

   } // getUnclickedNodes()

   /**
    * highlights links connected to the node being mouseovered
    * @param datum 
    */
   function mouseover(r){
      svg.selectAll('.links').selectAll('.link')
         .classed('selected',function(l){ return l.source == r || l.target == r });

   } // mouseover()

   /**
    * un-highlights links connected to the node being mouse out'd
    * event for mouseout
    */
   function mouseout(r){
      svg.selectAll('.links').selectAll('.link.selected')
         .classed('selected',false);
      svg.selectAll('.nodes').selectAll('.node.selected')
         .classed('selected',false);

   } // mouseout()

   /**
    * populates the graph with new nodes based on a clicked node
    */
   function getInomeProfiles(params,callback){
      var query = $.param(params);
      d3.json('https://graph.inome.com/proxy/search?' + query,function(json){
         callback(inome.translator.searchToGraphForm(json),json);
      });

   } // getInomeProfiles()

   /**
    * adds a loading gif to a given node
    * @param ele - grouping element to add the loader to
    */
   function startLoadAction(ele)
   {
      var el = d3.select(ele)
      el.append('image')
            .attr('class','loader')
            .attr('xlink:href', '/files/loader.gif')
            .attr('width', 16)
            .attr('height', 16);

   } // addImage()

   /**
    * removes loader image from node
    * @param ele - grouping element
    */
   function endLoadAction(ele)
   {
      var el = d3.select(ele);
      el.select('image').remove();

   } // removeLoaderImage()

   return graph;

} // Graph2
