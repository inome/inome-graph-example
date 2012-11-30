var inome = {};
inome.translator = {};

inome.translator.toGraphForm = function(responseBody)
{
   var root = responseBody;
   var newJson = {profiles:[]};

   if (root && root.Profiles.count)
   {
      var i,j;
      for (i = 0; i < root.Profiles.count; i++)
      {
         var profile = root.Profiles.Profile[i];
         if (profile != undefined)
         {
            var entry = {links:[], nodes:[]};
            var name = (profile.Name && profile.Name.FirstName) + ' ' + (profile.Name && profile.Name.LastName);
            var profileId = profile.ProfileID;
            entry.nodes.push({label: name, id: profileId,type:'person', extra: profile});

            if (profile.Relatives){
               for (j=0; j < profile.Relatives.count; j++){
                 var relative = profile.Relatives.Relative[j];
                 var relativeName = relative.Name.FirstName + ' ' + relative.Name.LastName;
                 var link = {source: profileId, target: relative.ProfileID};

                 if (relative.Relationship !== 'relative' && relative.Relationship !== undefined)
                 {
                    link.label = relative.Relationship;
                 }

                 entry.nodes.push({label:relativeName,id:relative.ProfileID, type: 'person',extra: relative});
                 entry.links.push(link);
               }
            }

            if (profile.Addresses){
               for (j=0; j < profile.Addresses.count; j++)
               {
                  var address = profile.Addresses.Address[j];
                  if (address.StreetAddress !== undefined)
                  {
                     var addressName = address.City || '' + (address.State ? (',' + address.State) : '');
                     var zip = address && address.Zip && address.Zip.split('-')[0];
                     var addressString = [address.StreetAddress, address.City, address.State, zip, address.Country].join('').replace(/\s/g,'').toUpperCase();
                     var addressId = base64.encode(addressString);
                     entry.nodes.push({label:addressName,id:addressId,type: 'address',extra: address});
                     entry.links.push({'source':profileId,'target':addressId});
                  }
               }
            }

            if (profile.Professional && profile.Professional.WorkHistory)
            {
               var ids = {};
               for (j = 0; j < profile.Professional.WorkHistory.count; j++)
               {
                  var position = profile.Professional.WorkHistory.Position[j];
                  // ensure we do not have duplicate entrys as we do not have a company id yet
                  if (position.CompanyName)
                  {
                     var id = 'professional-' + position.CompanyName;
                     if (!ids[id])
                     {
                        ids[id] = 1;
                        entry.nodes.push({label:position.CompanyName, id: id, type: 'professional', extra: position});
                        entry.links.push({source: profileId, target: id});
                     }
                  }
               }
            }

            if (profile.Education && profile.Education.Degrees)
            {
               var ids = {};
               for (j = 0; j < profile.Education.Degrees.count; j++)
               {
                  var degree = profile.Education.Degrees.Degree[j];
                  // ensure we don't have duplicate school names as we do not have a school id yet
                  if (degree.School)
                  {
                     var id = 'education-' + degree.School;
                     if (!ids[id])
                     {
                        ids[id] = 1;

                        entry.nodes.push({label: degree.School, id: id, type: 'education', extra: degree});
                        entry.links.push({source: profileId, target: id});
                     }
                  }
               }
            }

            newJson.profiles.push(entry);

         } // endif
      } // endfor
   } // endif

   newJson.status = 'OK';

   return newJson;

} // toGraphForm()

/**
 * this is basically a copy of toGraphForm but with naming conventions that follow the new formatting of the search api
 */
inome.translator.searchToGraphForm = function(responseBody)
{
   var root = responseBody;
   var newJson = {profiles:[]};

   if (root && root.profiles.count)
   {
      var i,j;
      for (i = 0; i < root.profiles.count; i++)
      {
         var profile = root.profiles.profile[i];
         if (profile != undefined)
         {
            var entry = {links:[], nodes:[]};
            var name = (profile.name && profile.name.firstName) + ' ' + (profile.name && profile.name.lastName);
            var profileId = profile.profileId;
            entry.nodes.push({name: name, id: profileId,type:'person', extra: profile});

            if (profile.relatives){
               for (j=0; j < profile.relatives.count; j++){
                 var relative = profile.relatives.relative[j];
                 var relativeName = relative.name.firstName + ' ' + relative.name.lastName;
                 var link = {'source': profileId, 'target': relative.profileId, 'value': 1};
                 if (relative.Relationship === 'spouse')
                 {
                    link.label = 'spouse';
                 }

                 entry.nodes.push({'name':relativeName,'id':relative.profileId, type: 'person',extra: relative});
                 entry.links.push(link);
               }
            }

            if (profile.addresses){
               for (j=0; j < profile.addresses.count; j++)
               {
                  var address = profile.addresses.address[j];
                  if (address.streetAddress !== undefined)
                  {
                     var addressName = address.city + ', ' + address.state;
                     var addressString = [address.streetAddress, address.city, address.state, address.zip, address.country].join('').replace(/\s/g,'').toUpperCase();
                     var addressId = base64.encode(addressString);
                     entry.nodes.push({'name':addressName,id:addressId,type: 'address',extra: address});
                     entry.links.push({'source':profileId,'target':addressId});
                  }
               }
            }

            if (profile.professional && profile.professional.workHistory)
            {
               var ids = {};
               for (j = 0; j < profile.professional.workHistory.count; j++)
               {
                  var position = profile.professional.workHistory.position[j];
                  // ensure we do not have duplicate entrys as we do not have a company id yet
                  if (position.companyName)
                  {

                     var id = 'professional-' + position.companyName;
                     if (!ids[id])
                     {
                        ids[id] = 1;
                           entry.nodes.push({name:position.companyName, id: id, type: 'professional', extra: position});
                           entry.links.push({source: profileId, target: id});
                     }
                  }
               }
            }

            if (profile.education && profile.education.degrees)
            {
               var ids = {};
               for (j = 0; j < profile.education.degrees.count; j++)
               {
                  var degree = profile.education.degrees.degree[j];
                  // ensure we don't have duplicate school names as we do not have a school id yet
                  if (degree.school)
                  {
                     var id = 'education-' + degree.school;
                     if (!ids[id])
                     {
                        ids[id] = 1;

                        entry.nodes.push({name: degree.school, id: id, type: 'education', extra: degree});
                        entry.links.push({source: profileId, target: id});
                     }
                  }
               }
            }

            newJson.profiles.push(entry);

         } // endif
      } // endfor
   } // endif

   newJson.status = 'OK';

   return newJson;

} // searchToGraphForm()

/**
 * translates iws' json into a d3 compatible json for tree form
 * @param byte[] - response body
 * @return json - translated json object
 */
inome.translator.toTreeForm = function(responseBody)
{
   var root = responseBody;

   var newJson = {};
   if (root && root.Profiles.count)
   {
      var profile = root.Profiles.Profile[0];
      var name = profile.Name.FirstName + ' ' + profile.Name.LastName;
      newJson.name = name;
      newJson.children = [];
      newJson.type = 'person';
      newJson.extra = profile;
      newJson.ProfileID = profile.ProfileID;

      if (profile.Addresses)
      {
         profile.Addresses.Address.forEach(function(item){
            var a = {name: (item.City ? item.City + ', ' : '') + item.State,
                     type: "address",
                     extra: item};
            newJson.children.push(a);
         });
      }

      if (profile.Relatives)
      {
         profile.Relatives.Relative.forEach(function(item){
            var r = {name: item.Name.FirstName + ' ' + item.Name.LastName,
                     type: "person",
                     profileId: item.ProfileID,
                     extra: item
                     };
            newJson.children.push(r);
         });
      }

      if (profile.Education)
      {
         profile.Education.Degrees.Degree.forEach(function(item){
            var major = item.Major;
            var school = item.School;
            var r = {name: school || major,
                     extra: item,
                     type: "education"}
            newJson.children.push(r);
         });
      }

      if (profile.Professional)
      {
         profile.Professional.WorkHistory.Position.forEach(function(item){
            var title = item.Title;
            var name = item.CompanyName;
            var r = {name: name || title,
                     extra: item,
                     type: "professional"}
            newJson.children.push(r);
         });
      }

      if (profile.ExternalProfiles)
      {
         profile.ExternalProfiles.ExternalProfile.forEach(function(item){
            var r = {name: item.Type,
                     extra: item,
                     type: 'social'};
            newJson.children.push(r);
         });
      }
   }

   newJson.status = 'OK';

   return newJson;

} // toTreeForm()

inome.translator.toPathitForm = function(html, callback){
   var limit = 1000;
   var contents = $(html).filter('center').html().split('<br>');
   $.each(contents,function(k,v){
      var matches = v.match(/\(([^\)]+)\)|\[([^\)]+)\]/g) || [];
      matches = $.map(matches,function(val,i){ return val.match(/\w+/g).join(' '); });
      contents[k] = matches;
      contents[k] = $.map(contents[k],function(val,i){
         if (["lt","gt","br"].indexOf(val) === -1)
         {
            return val;
         }
      });
   });

   contents = $.map(contents,function(val,i){ if (val.length){return [val];}});
   contents = contents.slice(0,limit);
   var data = {links: [], nodes:[], sourceEntity: null, targetEntity: null};
   var nodeMap = d3.map();
   var ids = [];
   $.each(contents, function(index,entry){
      $.each(entry, function(i,v){
         if (i % 2 === 0)
         {
            if (!nodeMap.has(v))
            {
               var type = "entity";
               var name = v;
               if (v.match(/([A-Z0-9]+){11}/g)){
                  ids.push(v);
                  type = "derp";
               }
               else if (v.match(/([0-9]+){9}/g)){
                  type = "zip";
               }

               var ent = {type: type, id: v,name: v};
               data.nodes.push(ent);
               nodeMap.set(v,1);
               if (i === 0) { data.sourceEntity = ent; }
               if (i === entry.length - 1){ data.targetEntity = ent; }

            }
         }
         else
         {
            data.links.push({name: v, source: entry[i-1], target: entry[i+1]});
         }
      });
   });

   d3.json('/inome/' + ids.join(','), function(json){
      var personMap = d3.map();
      $.each(json.Profiles.Profile, function(k,v){
         personMap.set(v.ProfileID, v);
      });

      $.each(data.nodes,function(k,v){
        if (v.type === 'derp' && personMap.has(v.id))
        {
           var person = personMap.get(v.id);
           v.name = person.Name.FirstName + ' ' + person.Name.LastName;
        }
      });

      callback(data);
   });

} // toPathitForm()

inome.translator.translateQueryAnalyzer = function(html){
   var json = {};
   $(html).find('tr').each(function(k,val){
     var d = $(val).find('td');
     var key = $(d[0]).html().trim().toLowerCase();
     var value = $(d[1]).html().trim();
     json[key] = value;
   });

   b = json;
   return json;
} // translateAnalyzer()

inome.translator.propertyToGraph = function(properties,id,callback)
{
   var data = {links: [], nodes: []};
   if (properties.PropertyRecords)
   {
      var property = properties.PropertyRecords.PropertyRecord[0];
      if (property.Neighbors && property.Neighbors.Neighbor){
         $.each(property.Neighbors.Neighbor,function(k,neighbor){
            var params = {
               firstname: neighbor.Name.FirstName._t,
               lastname: neighbor.Name.LastName._t,
               street: ((neighbor.StreetName && neighbor.StreetName._t || null) + (neighbor.StreetName && neighbor.StreetName._t) || null) || '',
               city: neighbor.Address.City._t,
               state: neighbor.Address.State._t
            }
            d3.json('/preview/?' + $.param(params), function(data){
               if (data.profiles && data.profiles.profile[0])
               {
                  var profile = data.profiles.profile[0];
                  var node = {label: profile.name.firstName + profile.name.lastName,id: profile.profileId, type: 'neighbor'};
                  callback({links: [{source: id, target: profile.profileId}], nodes: [node]});
               }
            });
         });
      }
      else
      {
         callback({links:[],nodes:[]});
      }
   }
   else
   {
      callback(data);
   }
} // propertyToGraph()
