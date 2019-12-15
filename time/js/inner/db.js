/*
{
    site: "douyu.com", 
    all: 704
}
*/
function allStore(obj) {
    var db = open.result;
    var tx = db.transaction("allStore", "readwrite");
    var allStore = tx.objectStore("allStore");
    allStore.put(obj);
}

/*
{
    site: "reactjs.org",
    date: "2018/4/7",
    duration: 164
}
*/
function historyStore(obj) {
    var db = open.result;
    var tx = db.transaction("historyStore", "readwrite");
    var historyStore = tx.objectStore("historyStore");
    historyStore.put(obj);
}