var graph = graphLib('#graph', {width: 100, height:105});

QUnit.test('config test', function(assert){
   assert.equal(graph.option('width'), 100, 'ensure width got set');
   assert.equal(graph.option('height'), 105, 'ensure height got set');

   graph.option('width', 200);
   assert.equal(graph.option('width'), 200, 'ensure setting options works');
});

QUnit.test('test reset method', function(assert){
   graph.addNodes([{name: 'nick', id:1},{name:'joe', id:2}]);
   graph.addLinks([{source: 1, target: 2}]);
   graph.reset();
   assert.equal($('.link, .node').length, 0, 'ensure nodes were removed');
});

QUnit.test('add node test', function(assert){
   graph.addNodes([{name: 'nick', id:1}]);
   assert.equal($('.node').length, 1);
   graph.reset();
});

QUnit.test('adding nodes of the same id', function(assert){
   graph.addNodes([{name: 'ricardo', id:1}]);
   graph.addNodes([{name: 'evil-ricardo', id:1}]);
   assert.equal($('.node').length, 1, 'adding nodes in two seperate calls');
   graph.reset();

   graph.addNodes([{name: 'ricardo', id:1},{name: 'evil-ricardo', id:1}]);
   assert.equal($('.node').length,1, 'adding nodes in one addNodes call');
   graph.reset();
});

QUnit.test('adding many nodes to the graph', function(assert){
   for (var i = 0; i < 1000; i++)
   {
      graph.addNodes([{name: '', id: i}]);
   }
   assert.equal($('.node').length, 1000);
   graph.reset();

   var nodes = [];
   for(var i = 0; i < 1000; i++)
   {
     nodes.push({name:'', id: i}); 
   }
   graph.addNodes(nodes);
   assert.equal($('.node').length, 1000);
   graph.reset();
});

/**
 * tests adding links to connect nodes
 */
QUnit.test('add links test', function(assert){
   graph.addNodes([{name: 'JJ', id: 0},{name: 'Chris', id:1}]);
   graph.addLinks([{target: 1, source: 0}]);
   assert.equal($('.link').length, 1);
   graph.reset();
});

QUnit.test('add links with same source and target', function(){
   graph.addNodes([{name: 'JG', id:0},{name: 'Chris', id:1}]);
   graph.addLinks([{target:1, source: 0}]);
   graph.addLinks([{target:1, source: 0}]);
   assert.equal($('.link').length, 1,'adding links on seperate calls');

   graph.addNodes([{name: 'JG', id:0},{name: 'Chris', id:1}]);
   graph.addLinks([{target: 1, source: 0}, {target:1, source:0}]);
   assert.equal($('.link').length, 1, 'adding links on the same add link call');
   graph.reset();
});

QUnit.test('add many links', function(){
   graph.addNodes([{name: '', id: 0}]);
   var count = 0;
   for (var i = 1; i < 1000; i++)
   {
      graph.addNodes([{name: '', id: i}]);
      graph.addLinks([{source: 0, target: i}]);
      count++;
   }

   assert.equal($('.link').length, count, 'link count matches added links count');
   graph.reset();
});

QUnit.test('test nodes get properly classed according to their type',function(assert){
   graph.addNodes([{name: 'Smokey Joe', type: 'forest-ranger', id:0}]);
   assert.equal($('.node.forest-ranger').length, 1);
   graph.reset();
});

QUnit.test('remove nodes', function(){
   graph.addNodes([{name: 'Snoopy', id: 1, type: 'dog'}, {name: 'Charley', id:2, type: 'person'}]);
   graph.remove({name: 'Snoopy'});
   assert.equal($('.node.dog').length, 0, 'dog node was removed');
   assert.equal($('.node.person').length, 1, 'person node remained'); 
   graph.reset();
});

QUnit.test('hide nodes', function(assert){
   graph.addNodes([{name: 'Fruitloop', id: 1, type:'bird'}, {name: 'Trix', id: 2, type:'rabbit'}]);
   graph.hide({type:'bird'});
   assert.equal($('.node.rabbit').length, 1, 'nodes not in the query still exist');
   assert.equal($('.node.bird').length, 0, 'nodes in the query were hidden');
   
   graph.show({type:'bird'});
   assert.equal($('.node').length, 2, 'nodes are correctly un-hidden');
   graph.reset();
});

QUnit.test('hidden links getter', function(assert){
   var nodes = [{name: 'nick', id: 0, type:'programmer'},
                {name: 'niraj',id: 1, type:'cto'},
                {name: 'michelle', id: 2, type: 'pgm'}];
   graph.addNodes(nodes);
   graph.hide({type: 'pgm'});
   assert.equal(graph.getHiddenNodes()[0], nodes[2],'ensure the correct node is begot');
   graph.reset();
});

QUnit.test('test links getter', function(assert){
   graph.addNodes([{name: 'greg', id: 1},{name:'ben', id:2}]);
   graph.addLinks([{source:1, target: 2}]);
   assert.equal(graph.getLinks().length, 1, 'ensure we get back one link');
   graph.reset();
});

QUnit.test('test node getter',function(assert){
   graph.addNodes([{name: 'nick', id:1},{name: 'Bro', id:2},{name: 'helly', id:3}]);
   assert.equal(graph.getNodes().length, 3, 'test we get the correct amount of nodes')
   graph.reset();
});

QUnit.test('test setting the root node', function(assert){
   var node = {name: 'hi', type: 'expression', id:0};
   graph.addNodes([node]);
   graph.setRoot(node);

   assert.equal(graph.getNodes()[0].depth, 0, 'make sure root node was set properly')
   graph.reset();
});
