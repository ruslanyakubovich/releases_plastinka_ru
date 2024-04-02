/*
  2022-09-19

  The author disclaims copyright to this source code.  In place of a
  legal notice, here is a blessing:

  *   May you do good and not evil.
  *   May you find forgiveness for yourself and forgive others.
  *   May you share freely, never taking more than you give.

  ***********************************************************************

  A basic demonstration of the SQLite3 "OO#1" API.
*/
'use strict';
(function () {

  function logHtml(cssClass, ...args) {
    const ln = document.createElement('div');
    if (cssClass) ln.classList.add(cssClass);
    ln.append(document.createTextNode(args.join(' ')));
    document.body.append(ln);
    console.log(args.join(' '))
  };

  function add(d, o) {
    //console.log(args);
    const ln = document.createElement('div');
    //ln.append(o.album_id + ' ' + o.album_name + ' ' + o.artist_name);
    ln.classList.add('releas');
    ln['title'] =  `${o.album_name} — ${o.artist_name}`;
    ln['style'] = `background-image: url(${getUrlImg(o.album_id)});`;
    d.append(ln);
  }

  const div_all = document.querySelector('#r_all');
  const div_new = document.querySelector('#r_new');

  const log = (...args) => logHtml('', ...args);
  const warn = (...args) => logHtml('warning', ...args);
  const error = (...args) => logHtml('error', ...args);

  const addNew = (args) => add(div_new, args);
  const addAll = (args) => add(div_all, args);
  const getUrlImg = (id) => { return  `/img/${id}.png`}

  const demo1 = function (sqlite3, dbUrl, immutable = false) {

    fetch(dbUrl)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => {
        if (!immutable) {
          arrayBuffer.resizeable = true;
        }
        const p = sqlite3.wasm.allocFromTypedArray(arrayBuffer);
        const db = new sqlite3.oo1.DB();
        let deserialize_flags =
          sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
        if (!immutable) {
          deserialize_flags |= sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE;
        }
        const rc = sqlite3.capi.sqlite3_deserialize(
          db.pointer, 'main', p, arrayBuffer.byteLength, arrayBuffer.byteLength, deserialize_flags);
        db.checkRc(rc);

        db.exec({
          sql: "select * from albums a where a.release_date > date()",
          rowMode: 'object', // 'array' (default), 'object', or 'stmt'
          callback: function (row) {
            addNew(row);
          }.bind({ counter: 0 })
        });

        db.exec({
          sql: "select * from albums a where a.release_date <= date() order by a.release_date limit 100",
          rowMode: 'object', // 'array' (default), 'object', or 'stmt'
          callback: function (row) {
            addAll(row);
          }.bind({ counter: 0 })
        });

      });
  };



  globalThis.sqlite3InitModule({
    /* We can redirect any stdout/stderr from the module like so, but
       note that doing so makes use of Emscripten-isms, not
       well-defined sqlite APIs. */
    print: log,
    printErr: error
  }).then(function (sqlite3) {
    //console.log('sqlite3 =',sqlite3);
    //log("Done initializing. Running demo...");

    try {
      demo1(sqlite3, 'my_albums.db');
    } catch (e) {
      error("Exception:", e.message);
    }

  });
})();
