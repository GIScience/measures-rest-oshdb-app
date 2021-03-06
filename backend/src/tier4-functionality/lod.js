const url = require('url')

const C = require('./../constants')
const settingsApp = require('./../settings')
const {itemForUser, allItemsShort} = require('./items')
const {urlPrefixParameter} = require('./java')

// ROUTES //

module.exports.getMeasure = user => (req, res) => {
  const item = itemForUser(C.MEASURE, user, req.params.id)
  if (!item) res.status(404).send('Item does not exist')
  const types = typesFromMeasure(item)
  res.render('measure', Object.assign(defaultData(req), {
    title: item.name,
    itemMeta: {
      uri: `${settingsApp.repositoryUrl}/measure/${item.id}`,
      type: types.join(' '),
      itemTitle: item.name,
      itemTypeTitle: nameForTypesOfMeasure(types),
      isOSM: isOSM(item),
      isQualityMeasure: isQualityMeasure(item),
      implementedBy: listToPersonList(item.implementedBy),
      documentedBy: listToPersonList(item.documentedBy),
      linkToMap: `${settingsApp.repositoryUrl}/map/${item.id}`,
      api: {
        prefix: settingsApp.apiPublic.prefix,
        main: settingsApp.apiPublic.main(item.id, C.PORT_PUBLIC_SERVICE),
        suffix: '?resolution={resolution}&bbox={bounding box}' + urlPrefixParameter(item),
      },
      usesGrounding: groundingsFromMeasure(item),
      assessesTag: tagsFromMeasure(item),
    },
    item: item,
  }))
}
module.exports.getResult = user => (req, res) => {
  const item = itemForUser(C.RESULT, user, req.params.id)
  if (!item) res.status(404).send('Item does not exist')
  res.render('result', Object.assign(defaultData(req), {
    title: item.name,
    itemMeta: {
      uri: `${settingsApp.repositoryUrl}/result/${item.id}`,
      type: 'dq:result',
      itemTitle: item.name,
      itemTypeTitle: 'Result',
      documentedBy: listToPersonList(item.documentedBy),
    },
    item: item,
  }))
}
module.exports.getContext = user => (req, res) => {
  const item = itemForUser(C.CONTEXT, user, req.params.id)
  if (!item) res.status(404).send('Item does not exist')
  res.render('context', Object.assign(defaultData(req), {
    title: item.name,
    itemMeta: {
      uri: `${settingsApp.repositoryUrl}/context/${item.id}`,
      type: 'dq:context',
      itemTitle: item.name,
      itemTypeTitle: 'Context',
      documentedBy: listToPersonList(item.documentedBy),
    },
    item: item,
  }))
}
module.exports.getPerson = user => (req, res) => {
  const item = itemForUser(C.PERSON, user, req.params.id)
  if (!item) res.status(404).send('Item does not exist')
  res.render('person', Object.assign(defaultData(req), {
    title: item.name,
    type: 'foaf:person',
    itemMeta: {
      uri: `${settingsApp.repositoryUrl}/person/${item.id}`,
      itemTitle: item.name,
      itemTypeTitle: 'Person',
    },
    item: item,
    license: null,
  }))
}

// HELPING FUNCTIONS //

const typesFromMeasure = measure => {
  let types = (isOSM(measure)) ? ['dq:measure', 'dq:spatialMeasure', 'osmdq:spatialMeasure'] : ['dq:measure', 'dq:spatialMeasure']
  if (isQualityMeasure(measure)) return types = types.concat((isOSM(measure)) ? 'osmdq:spatialDataQualityMeasure' : 'dq:dataQualityMeasure')
  return types
}

const isOSM = measure => measure.appliesToDataset && measure.appliesToDataset.id === 'osmdq:OpenStreetMap'
const isQualityMeasure = measure => measure.usesGrounding && measure.usesGrounding.length > 0

const nameForTypesOfMeasure = types => {
  if (types.includes('osmdq:spatialDataQualityMeasure')) return 'OpenStreetMap Data Quality Measure'
  if (types.includes('osmdq:spatialMeasure')) return 'OpenStreetMap Measure'
  if (types.includes('dq:dataQualityMeasure')) return 'Data Quality Measure'
  if (types.includes('dq:measure')) return 'Measure'
  return ''
}

const groundingsFromMeasure = measure => (measure.usesGrounding === undefined || measure.usesGrounding === null) ? [] : measure.usesGrounding.map(g => ({
  id: g.id,
  label: C.LOD_GROUNDING_DICTIONARY[g.id],
}))

const tagsFromMeasure = measure => (measure.assessesTag === undefined || measure.assessesTag === null) ? [] : measure.assessesTag.split(/[,;]/).map(t => t.match(/ *"?([^"=]*)"? *(= *"?([^"=]*)"? *)?/)).map(t => ({
  key: t[1].trim(),
  value: (t[3]) ? t[3].trim() : undefined,
}))

const listToPersonList = list => {
  if (!list) return []
  const result = list.map(p => itemForUser(C.PERSON, null, p.id)).filter(p => p)
  result.map(p => p.forenameShort = forenameToForenameShort(p.forename))
  return result
}

const forenameToForenameShort = forename => (forename) ? forename.replace(/[a-zß-ÿ]/g, '') : ''

module.exports.defaultData = defaultData = (req, withTypes=false) => {
  const items = []
  C.ITEM_CLASSES.map(c => items.push(Object.assign({list: allItemsShort(c.path)}, c)))
  return {
    home: {
      titleLong: C.REPOSITORY_NAME_LONG,
      titleShort: C.REPOSITORY_NAME_SHORT,
      url: settingsApp.repositoryUrl,
      namespaces: C.REPOSITORY_NAMESPACES,
      items: items,
    },
    url: url.format({
      protocol: req.protocol,
      host: req.hostname,
      pathname: req.originalUrl,
    }),
    license: {
      source: settingsApp.repositoryUrl + '/static/license.md',
      title: 'MIT license',
      itemsLicensed: 'description and source code',
    },
  }
}
