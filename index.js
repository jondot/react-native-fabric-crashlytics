'use strict';

import StackTrace from 'stacktrace-js';
import { Crashlytics } from 'react-native-fabric';
import SourceMap from 'source-map';

function nomap(row){
  return {};
}

function init(smap) {
  if (__DEV__) {
    // Don't send exceptions from __DEV__, it's way too noisy!
    // Live reloading and hot reloading in particular lead to tons of noise...
    return;
  }

  let mapper = nomap;
  if(smap){
    const mapConsumer = new SourceMap.SourceMapConsumer(smap);
    mapper = (row)=>{
      const loc = mapConsumer.originalPositionFor({
                                  line: row.lineNumber,
                                  column: row.columnNumber,
                              });
      return loc;
    }
  }

  var originalHandler = global.ErrorUtils.getGlobalHandler();
  function errorHandler(e) {
    StackTrace.fromError(e).then((x)=>Crashlytics.recordCustomExceptionName(e.message, e.message, x.map(row=>{
      const loc = mapper(row);
      return {
        fileName: loc.source || e.message,
        columnNumber: loc.column || row.columnNumber,
        lineNumber: loc.line || row.lineNumber,
        functionName: loc.source ? `${loc.name}@${loc.source} ${loc.line}:${loc.column}` : (row.functionName || '') //next best thing without a consistent function name
      };
    })));
    // And then re-throw the exception with the original handler
    if (originalHandler) {
      originalHandler(e);
    }
  }
  global.ErrorUtils.setGlobalHandler(errorHandler);
}

module.exports = {
  init,
}
