/**
 * @author Nick Rushton (nrushton@intelius.com)
 * @since November 30th, 2012
 * @version 1.0
 *
 * tested against jquery 1.8.1
 *
 * @dependency d3.js <d3js.org>
 * @dependency jquery 1.8.1 <jquery.com>
 *
 * A simple graph library for adding and removing nodes and links from a graph
 * @param selector - element that will contain the graph
 * @param conf - configuration
 */
function graphLib(selector, conf)
{
   "use strict";
   conf = conf || {};
   var config = {
      /**
       * width of the canvas
       */
      width: 960,
      /**
       * height of the canvas
       */
      height: 800,
      /**
       * whether or not the graph should be zoomable
       */
      zoomable: true,
      /**
       * a function to call when a node is clicked
       */
      click: function(){},
      /**
       * a function to call when a node is moused over
       */
      mouseover: function(){},
      /**
       * a function to call when a node is moused out
       */
      mouseout: function(){},
      /**
       * charge of the nodes, can also be a function
       */
      charge: -150,
      /**
       * node's gravity
       */
      gravity: 0.1,
      /**
       * strength between the links
       */
      linkStrength: 0.1,
      /**
       * constant which scales the link lengths
       */
      linkLengthConstant: 5,
      /**
       * link style can be one of the following:
       *  'straight' - straight line from node to node
       *  'bezier' - slightly curved lines from node to node
       *  'arc' - arced line to the node
       */
      linkStyle: 'straight',
      /**
       * style is a key-value pair of node type as key
       * and another object of style attributes for an
       * svg element
       */
      style: {
         defaultStyle: {r: 5}
      }
   };

   var
       /**
        * data used throughout the script
        */
       data = {links: [], nodes: []},

       /**
        * functions for calculating link styles
        */
       linkStyles = {
          bezier: d3.svg.diagonal()
                     .projection(function(d){ return [d.x,d.y]; }),
          straight: straight,
          arc: arc
       },
       /**
        * holds the wrapping elements for node and link data
        */
       linksGroup,
       nodesGroup,
       /**
        * the root node
        */
       root,
       /**
        * d3 force simulation object
        */
       force,
       /**
        * d3 svg object
        */
       svg,
       /**
        * pool of hidden links and nodes
        */
       hiddenPool = {};

   $.extend(conf.style || {}, config.style);
   $.extend(config,conf);

   /**
    * initialization immediate function
    */
   (function init()
    {
      force = d3.layout.force()
           .charge(function(d)
              {
                 return config.charge - ((d.connections && d.connections.entries().length) || 1) * 20;
              })
           .gravity(config.gravity)
           .linkStrength(config.linkStrength)
           .linkDistance(function(d)
              {
                 return ((d.target.connections && d.target.connections.entries().length) || 1) * config.linkLengthConstant;
              })
           .size([config.width,config.height])
           .on('tick',tock);

      d3.select(selector).select('svg').remove();
      svg = d3.select(selector)
         .append('svg')
            .attr('width',config.width)
            .attr('height',config.height);

      if (config.zoomable)
      {
         svg = svg.append('g')
                  .attr('width',config.width)
                  .attr('height',config.height)
               .call(d3.behavior.zoom().on('zoom',redraw))
               .append('g');

         svg.append('rect')
              .attr('width',config.width)
              .attr('height',config.height)
              .attr('fill','white');
      }

      /**
       * zooms when the mouse is scrolled
       */
      function redraw()
      {
         svg.attr('transform','translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');

      } // redraw

   })();

   linksGroup = svg.append('g').attr('class','links');
   nodesGroup = svg.append('g').attr('class','nodes');

   update();

   /**
    * @return nodes in the graph
    */
   function getNodes()
   {
      return data.nodes;

   } // getNodes

   /**
    * sets the root node
    * @param r - object to set with
    */
   function setRoot(r)
   {
      r.depth = 0;
      root = r;

   } // setRoot

   /**
    * gets the root node
    */
   function getRoot()
   {
      return root;

   } // getRoot

   /**
    * gets the list of links hidden (using the hide method)
    */
   function getHiddenLinks()
   {
      var links = [];
      var pushLink = function(k,v){ links.push(v); };
      for (var hash in hiddenPool)
      {
         if (hiddenPool.hasOwnProperty(hash))
         {
            $.each(hiddenPool[hash].links,pushLink);
         }
      }

      return links;

   } // getHiddenLinks

   /**
    * gets the list of nodes hidden (using the hide method)
    */
   function getHiddenNodes()
   {
      var nodes = [];
      var pushNode = function(k,v) { nodes.push(v); };
      for (var hash in hiddenPool)
      {
         if (hiddenPool.hasOwnProperty(hash))
         {
            $.each(hiddenPool[hash].nodes,pushNode);
         }
      }

      return nodes;

   } // getHiddenNodes

   /**
    * gets links currently visible
    */
   function getLinks()
   {
      return data.links;

   } // getLinks

   /**
    * adds nodes in the minimum form {name: <label for the node>, id: <unique id for the node>}
    * nodes added with an id already in the pool will be ignored
    * @param nodes - nodes to add
    * @param near - optional parameter to place new nodes near a particular node
    */
   function addNodes(nodes, near)
   {
      nodes = setupNodes(nodes);
      var nodesMap = mapNodes(data.nodes);
      nodesMap.addNodes(g.getHiddenNodes());
      $.each(nodes,function(k,n)
            {
         if (!nodesMap.has(n.id))
         {
            var show = true;
            var pool = data.nodes;

            // find out if the node is part of the hidden nodes
            for (var hash in hiddenPool)
            {
               if (hiddenPool.hasOwnProperty(hash))
               {
                  var selector = deserializeObject(hash);
                  if (isSubset(n,selector) && show)
                  {
                     show = false;
                     pool = hiddenPool[hash].nodes;
                  }
               }
            }

            pool.push(n);

            if (near)
            {
               n.x = randomOffset(near.x,200);
               n.y = randomOffset(near.y,200);
            }
            nodesMap.addNodes([n]);
         }
      });

      force.nodes(data.nodes).start();
      updateNodes();

   } // addNodes

   /**
    * adds links to the visualization in the minimum form {source: <string id of the source object>, target: <"">}
    * links which are already present in the map will be ignored
    * @param links - links to add
    */
   function addLinks(links)
   {
      var linksMap = mapLinks(data.links);
      links = setupLinks(links);
      $.each(links,function(k,l)
      {
         if (!linksMap.hasLink(l))
         {
            var show = true;
            var pool = data.links;
            for (var hash in hiddenPool)
            {
               if (hiddenPool.hasOwnProperty(hash))
               {
                  var selector = deserializeObject(hash);
                  if ((isSubset(l.source,selector) || isSubset(l.target,selector)) && show)
                  {
                     show = false;
                     pool = hiddenPool[hash].links;
                  }
               }
            }

            l.source.connections = l.source.connections || d3.map();
            l.source.connections.set(l.target.id,1);

            pool.push(l);
            linksMap.addLinks([l]);
         }
      });

      force.links(data.links).start();
      updateLinks();

   } // addLinks

   /**
    * removes a node and it's associated links from the graph
    * given we have nodes of specs: {id: 12345, name: 'Nick Rushton', type: 'person'} and
    *                               {id: 12346, name: 'Ken Doll', type:'person'}
    * if we pass remove the selector: {id: 12345} the Nick Rushton node above will be removed
    * given we pass the selector: {type: 'person'} both nodes will be removed because they are type person
    * finally given teh selector: {name: 'Ken Doll', type: 'person'} only the Ken Doll node will be removed
    * @param selector - object of values to match against
    *                   e.g. {type: 'person'}
    */
   function remove(selector)
   {
      var
         pool,
         deleted = {links:[],nodes:[]},
         newData = {links:[],nodes:[]},
         rem;
      data.links = $.each(data.links,function(k,l)
      {
         rem = isSubset(l.source,selector) || isSubset(l.target,selector);
         pool = rem ? deleted.links : newData.links;
         pool.push(l);
      });

      data.nodes = $.each(data.nodes, function(k,n)
      {
         rem = isSubset(n,selector);
         pool = rem ? deleted.nodes : newData.nodes;
         pool.push(n);
      });

      g.clear();
      g.addNodes(newData.nodes);
      g.addLinks(newData.links);

      return deleted;

   } // remove

   /**
    * hide simply removes the nodes and stores them to be shown later
    * @param selector - selector for nodes to delete
    */
   function hide(selector)
   {
      hiddenPool[serializeObject(selector)] = g.remove(selector);

   } // hide

   /**
    * shows a previously hidden selection of people
    * note: as of now the selector must be the same which the nodes were hidden with
    * @param selector - selector for nodes to show again
    */
   function show(selector)
   {
      var hash = serializeObject(selector);
      if (hiddenPool[hash])
      {
         var nodes = hiddenPool[hash].nodes;
         var links = hiddenPool[hash].links;
         delete hiddenPool[hash];
         g.addNodes(nodes);
         g.addLinks(links);
      }

   } // show

   function clear()
   {
      data.links = [];
      data.nodes = [];
      force.links(data.links).nodes(data.nodes);
      update();

   } // clear

   /**
    * resets the graph to initial state
    */
   function reset()
   {
      g.clear();
      hiddenPool = {};

   } // reset

   /**
    * given a key and val are passed in, the value will be set and the new value returned
    * given only a key is passed the value will be returned
    * @param key - key to get
    * @param val - val to set with
    * @return value of the config option
    */
   function option(key,val)
   {
      var v = (val !== undefined ? val : null);

      if (v)
      {
         if (config[key])
         {
            config[key] = v;
         }
      }

      update();
      return config[key];

   } // option

   /*=====================
     privates
    =====================*/
   /**
    * puts an initial starting position for nodes
    * otherwise they enter from 0,0
    * @param nodes - nodes to set up
    */
   function setupNodes(nodes)
   {
      $.each(nodes,function(k,n)
      {
         if (!n.x && !n.y)
         {
            n.x = randomOffset((config.width/2),200);
            n.y = randomOffset((config.height/2),200);
         }
      });

      return nodes;

   } // setupNodes

   /**
    * sets up source and target as references to the actual nodes
    * @param links - links to setup up
    */
   function setupLinks(links)
   {
      var nodesMap = mapNodes(data.nodes);
      $.each(hiddenPool,function(k,v)
      {
         $.each(v.nodes, function(k,n)
         {
            nodesMap.set(n.id,n);
         });
      });

      $.each(links,function(k,l)
      {
         // if the link has not been set up yet
         if (typeof l.source !== 'object')
         {
            l.source = nodesMap.get(l.source);
            l.target = nodesMap.get(l.target);

            if (root)
            {
               var depth = 1;
               if (l.source.depth)
               {
                  depth = (l.target.depth || Infinity) > (l.source.depth + 1) ? l.source.depth + 1 : l.target.depth;
               }

               if (l.target !== root)
               {
                  l.target.depth = depth;
               }
            }
         }
      });

      return links;

   } // setupLinks

   /**
    * updates both links and nodes
    */
   function update()
   {
      updateLinks();
      updateNodes();

   } // update

   /**
    * updates the graph with new links and deleting old links
    */
   function updateLinks()
   {

     var link = linksGroup.selectAll('g.link')
         .data(data.links);

     link.enter()
        .append('g')
           .attr('class',function(d){return 'link ' + (d.target.type || '');})
           .append('path')
              .on('mouseover',config.mouseover);

     linksGroup.selectAll('g.link path')
        .attr('d',linkStyles[config.linkStyle]);

     link.exit().remove();

   } // updateLinks

   /**
    * updates the visual with new nodes and deletes old nodes
    */
   function updateNodes()
   {
     var node = nodesGroup.selectAll('g.node').data(data.nodes);
     var nodeEnter =
        node.enter().append('g')
           .attr('class',function(d){ return 'node ' + (d.type || '');})
           .on('click',config.click)
           .on('mouseover',config.mouseover)
           .on('mouseout',config.mouseout);

     nodeEnter.append('circle')
            .attr('r', function(d)
            {
                  var type = d.type || '';
                  return (config.style[type] && config.style[type].r) ||
                          config.style.defaultStyle.r;
            })
            .attr('cx', function(d){ return d.x;})
            .attr('cy', function(d){ return d.y;});

     nodeEnter.append('text')
            .text(function(d){ return d.name; });

     node.exit().remove();

   } // updateNodes

   /**
    * function to run every tick of the simulation
    * updates physical location of svg elements on page
    */
   function tock()
   {
        nodesGroup.selectAll('g.node circle')
           .attr('cx', function(d){ return d.x; })
           .attr('cy', function(d){ return d.y; });

        nodesGroup.selectAll('text')
           .attr('x', function(d){ return d.x - 20; })
           .attr('y', function(d){ return d.y + 3; });

        nodesGroup.selectAll('image')
           .attr('x', function(d){ return d.x - 7;})
           .attr('y', function(d){ return d.y - 7;});

        linksGroup.selectAll('g.link path')
           .attr('d',linkStyles[config.linkStyle]);

   } // tock

   /**
    * takes a javascript object and builds a unique string
    * @param obj - object to stringify
    */
   function serializeObject(obj)
   {
      return JSON.stringify(obj);

   } // serializeObject

   /**
    * deserializes javascript object string
    * @param string - object to unstringify
    */
   function deserializeObject(string)
   {
      return JSON.parse(string);

   } // deserializeObject

   /**
    * @param source - the source object to test against
    * @param subset - the subset we want to check
    * @return bool - whether or not subset is a subset of source
    */
   function isSubset(source, subset)
   {
      var s = true;
      for (var key in subset)
      {
         if (subset.hasOwnProperty(key))
         {
            s = subset[key] === source[key] && s ? true : false;
         }
      }

      return s;

   } // isSubset

   function arc(d)
   {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
   } // arc

   function straight(d)
   {
      return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
   }

   /**
    * produces a random number between n and (n + range)
    * @param int - starting number
    * @return int - a number randomly offset from the starting number
    */
   function randomOffset(n,range)
   {
      return n + Math.random() * (range/2) * (Math.random() * 0.5 ? -1 : 1);

   }

   /**
    * @param array of nodes to map
    * @return map of node ids to nodes
    */
   function mapNodes(nodes)
   {
      var nodesMap = d3.map();

      nodesMap.__proto__.addNodes = function(ns)
      {
         $.each(ns, function(k,n)
         {
            nodesMap.set(n.id,n);
         });
      };

      nodesMap.addNodes(nodes);
      return nodesMap;

   } // mapNodes

   /**
    * @param array of links
    * @return map of (target id concated to source id) => link
    */
   function mapLinks(links)
   {
      var linksMap = d3.map();
      linksMap.__proto__.hasLink = function(l)
      {
         var source = l.source.id !== undefined ? l.source.id : l.source;
         var target = l.target.id !== undefined ? l.target.id : l.target;
         return this.has(source + '' + target) || this.has(target + '' + source);
      };

      linksMap.__proto__.addLinks = function(ls)
      {
         $.each(ls,function(k,l)
         {
            linksMap.set(l.source.id + '' + l.target.id,l);
         });
      };

      linksMap.addLinks(links);
      return linksMap;

   } // mapLinks

   /**
    * graph lib client facing interface
    */
   var g = {
      getNodes: getNodes,
      getLinks: getLinks,
      setRoot: setRoot,
      getRoot: getRoot,
      getHiddenLinks: getHiddenLinks,
      getHiddenNodes: getHiddenNodes,
      addNodes: addNodes,
      addLinks: addLinks,
      remove: remove,
      hide: hide,
      show: show,
      reset: reset,
      clear: clear,
      option: option
   };

   return g;

} // graphlib
