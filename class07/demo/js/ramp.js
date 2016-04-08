(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var RAMPApp = require("./ramp/RAMPApp");

ReactDOM.render(React.createElement(RAMPApp, null), document.getElementById('ramp-placeholder'));

},{"./ramp/RAMPApp":5}],2:[function(require,module,exports){
module.exports = DB;

function DB() {
    var id_gen = 0;
    this.values = [];
    this.index = {};
    this.committed = {};
    this.proposers = [];
    this.broadcasts = [];
    this.broadcast_ballot_number = function (n) {
        this.broadcasts.push({ id: id_gen++, n: n });
    };
    this.apply_ballot_number = function (id) {
        var nova = [];
        this.broadcasts.forEach(function (req) {
            if (req.id == id) {
                this.proposers.forEach(function (proposer) {
                    proposer.n = Math.max(proposer.n, req.n);
                });
            } else {
                nova.push(req);
            }
        }.bind(this));
        this.broadcasts = nova;
    };
    this.gc = function () {
        var next = [];
        this.values.forEach(function (value) {
            if (value.txid == this.committed[value.key.shard][value.key.key].txid) {
                next.push(value);
            }
        }.bind(this));
        this.values = next;
    };
    this.prepare = function (shard, values) {
        for (var i = 0; i < values.length; i++) {
            var value = clone(values[i]);
            if (!this.index.hasOwnProperty(shard)) {
                this.index[shard] = {};
            }
            if (!this.index[shard].hasOwnProperty(value.key.key)) {
                this.index[shard][value.key.key] = {};
            }
            this.index[shard][value.key.key]["" + value.txid] = value;
            this.values.push(value);
        }
    };
    this.commit = function (shard, txids) {
        if (!this.committed.hasOwnProperty(shard)) {
            this.committed[shard] = {};
        }

        var txid_index = {};
        txids.forEach(function (txid) {
            txid_index[txid] = true;
        });

        this.values.forEach(function (value) {
            if (value.key.shard == shard && txid_index[value.txid]) {
                if (!this.committed[shard].hasOwnProperty(value.key.key)) {
                    this.committed[shard][value.key.key] = {
                        txid: value.txid, is_final: false
                    };
                }
                if (this.committed[shard][value.key.key].txid < value.txid) {
                    this.committed[shard][value.key.key].txid = value.txid;
                    this.committed[shard][value.key.key].is_final = false;
                }
            }
        }.bind(this));
    };
    this.finalize = function (shard, txids) {
        var txid_index = {};
        txids.forEach(function (txid) {
            txid_index[txid] = true;
        });

        this.values.forEach(function (value) {
            if (value.key.shard == shard && txid_index[value.txid]) {
                if (this.committed[shard][value.key.key].txid == value.txid) {
                    this.committed[shard][value.key.key].is_final = true;
                }
            }
        }.bind(this));
    };
    this.get = function (shard, values) {
        var result = [];

        values.forEach(function (value) {
            var txid = value.txid;
            if (txid == null) {
                txid = this.committed[shard][value.key.key].txid;
            }

            var obj = clone(this.index[shard][value.key.key]["" + txid]);
            if (this.committed.hasOwnProperty(shard) && this.committed[shard].hasOwnProperty(value.key.key) && this.committed[shard][value.key.key].txid == txid) {
                obj.is_final = this.committed[shard][value.key.key].is_final;
            }
            result.push(obj);
        }.bind(this));

        return result;
    };
    this.get_debts = function (person) {
        return this.values.filter(function (val) {
            return val.key.shard == person;
        }).map(function (x) {
            return clone(x);
        });
    };
}

function clone(x) {
    return JSON.parse(JSON.stringify(x));
}

},{}],3:[function(require,module,exports){
var ProposersView = React.createClass({
    displayName: "ProposersView",

    renderValueTr: function (proposer) {
        return React.createElement(
            "tr",
            null,
            React.createElement(
                "td",
                null,
                proposer.name
            ),
            React.createElement(
                "td",
                null,
                proposer.proposer_id
            ),
            React.createElement(
                "td",
                null,
                proposer.n
            )
        );
    },
    render: function () {
        return React.createElement(
            "div",
            { className: "info-block dbview" },
            React.createElement(
                "h3",
                null,
                "Proposers"
            ),
            React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    React.createElement(
                        "tr",
                        { className: "header" },
                        React.createElement(
                            "th",
                            null,
                            "name"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "proposer id"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "n"
                        )
                    ),
                    this.props.db.proposers.map(function (proposer) {
                        return this.renderValueTr(proposer);
                    }.bind(this))
                )
            ),
            React.createElement(
                "div",
                null,
                this.props.db.broadcasts.map(function (broadcast) {
                    function apply() {
                        this.props.db.apply_ballot_number(broadcast.id);
                        this.props.model.notify();
                    }
                    return React.createElement(
                        "button",
                        { onClick: apply.bind(this) },
                        "broadcast n=" + broadcast.n
                    );
                }.bind(this))
            )
        );
    }
});

var CommittedView = React.createClass({
    displayName: "CommittedView",

    renderValueTr: function (committed) {
        return React.createElement(
            "tr",
            null,
            React.createElement(
                "td",
                null,
                committed.shard,
                "/",
                committed.key
            ),
            React.createElement(
                "td",
                null,
                committed.txid
            ),
            React.createElement(
                "td",
                null,
                committed.is_final ? "true" : "false"
            )
        );
    },
    render: function () {
        return React.createElement(
            "div",
            { className: "info-block dbview" },
            React.createElement(
                "h3",
                null,
                "Committed"
            ),
            React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    React.createElement(
                        "tr",
                        { className: "header" },
                        React.createElement(
                            "th",
                            null,
                            "key"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "txid"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "is_final"
                        )
                    ),
                    this.props.committed.map(function (committed) {
                        return this.renderValueTr(committed);
                    }.bind(this))
                )
            )
        );
    }
});

var ValuesView = React.createClass({
    displayName: "ValuesView",

    gc: function () {
        this.props.model.gc();
    },
    renderValueTr: function (value) {
        return React.createElement(
            "tr",
            null,
            React.createElement(
                "td",
                null,
                value.key.shard,
                "/",
                value.key.key
            ),
            React.createElement(
                "td",
                null,
                value.txid
            ),
            React.createElement(
                "td",
                null,
                value.value
            ),
            React.createElement(
                "td",
                null,
                value.md.map(function (md) {
                    return React.createElement(
                        "div",
                        null,
                        md.shard,
                        "/",
                        md.key
                    );
                })
            )
        );
    },
    render: function () {
        var model = this.props.model;
        return React.createElement(
            "div",
            { className: "info-block dbview" },
            React.createElement(
                "h3",
                null,
                "Values",
                !model.tx1.is_active && !model.tx2.is_active ? React.createElement(
                    "button",
                    { onClick: this.gc },
                    "Collect garbage"
                ) : React.createElement(
                    "button",
                    { disabled: "disabled", onClick: this.gc },
                    "Collect garbage"
                )
            ),
            React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    React.createElement(
                        "tr",
                        { className: "header" },
                        React.createElement(
                            "th",
                            null,
                            "key"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "txid"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "value"
                        ),
                        React.createElement(
                            "th",
                            null,
                            "meta"
                        )
                    ),
                    this.props.values.map(function (value) {
                        return this.renderValueTr(value);
                    }.bind(this))
                )
            )
        );
    }
});

module.exports = React.createClass({
    displayName: "exports",

    render: function () {
        var db = this.props.model.db;
        var model = this.props.model;

        var sharded = {};
        for (var i = 0; i < db.values.length; i++) {
            var value = db.values[i];
            if (!sharded.hasOwnProperty(value.key.shard)) {
                sharded[value.key.shard] = true;
            }
        }

        var shards = [];
        for (var shard in sharded) {
            if (!sharded.hasOwnProperty(shard)) continue;
            shards.push(shard);
        }
        shards = shards.sort();

        var committed = [];
        shards = shards.forEach(function (shard) {
            var keys = [];
            for (var key in db.committed[shard]) {
                if (!db.committed[shard].hasOwnProperty(key)) continue;
                keys.push(key);
            }
            keys = keys.sort();

            keys.forEach(function (key) {
                committed.push({
                    shard: shard,
                    key: key,
                    txid: db.committed[shard][key].txid,
                    is_final: db.committed[shard][key].is_final
                });
            });
        });

        return React.createElement(
            "table",
            null,
            React.createElement(
                "tbody",
                null,
                React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "td",
                        { style: { verticalAlign: "top" } },
                        React.createElement(CommittedView, { committed: committed }),
                        React.createElement(ProposersView, { db: db, model: model })
                    ),
                    React.createElement(
                        "td",
                        { style: { verticalAlign: "top", paddingLeft: "5px" } },
                        React.createElement(ValuesView, { values: reverse(db.values), model: model })
                    )
                )
            )
        );
    }
});

function reverse(values) {
    values = JSON.parse(JSON.stringify(values));
    values.reverse();
    return values;
}

},{}],4:[function(require,module,exports){
module.exports = KeyTable;

function KeyTable(bydefault) {
    this.store = [];
    this.put = function (key, value) {
        for (var i = 0; i < this.store.length; i++) {
            if (this.store[i].has(key)) {
                this.store[i].value = value;
                return;
            }
        }
        this.store.push(item(key, value));
    };
    this.get = function (key) {
        for (var i = 0; i < this.store.length; i++) {
            if (this.store[i].has(key)) {
                return this.store[i].value;
            }
        }
        this.store.push(item(key, bydefault()));
    };
    this.values = function () {
        var result = [];
        for (var i = 0; i < this.store.length; i++) {
            result.push(this.store[i].value);
        }
        return result;
    };
    this.forEach = function (iter) {
        for (var i = 0; i < this.store.length; i++) {
            iter(this.store[i].key, this.store[i].value);
        }
    };
    this.as_obj = function () {
        var obj = {};
        for (var i = 0; i < this.store.length; i++) {
            var key = this.store[i].key.shard + "/" + this.store[i].key.key;
            obj[key] = this.store[i].value;
        }
        return obj;
    };
    function item(key, value) {
        return {
            has: function (x) {
                return x.shard == key.shard && x.key == key.key;
            },
            key: key,
            value: value
        };
    }
}

},{}],5:[function(require,module,exports){
var RAMPModel = require("./RAMPModel");
var view = require("../stepbystep/view");
var ThreadView = require("../yabandeh/ThreadView");
var SideView = require("./SideView");

var CodeView = view.CodeView;

module.exports = React.createClass({
    displayName: "exports",

    getInitialState: function () {
        RAMPModel.on_state_updated = function (app_model) {
            this.setState(app_model);
        }.bind(this);

        return RAMPModel;
    },

    render: function () {
        return React.createElement(
            "table",
            null,
            React.createElement(
                "tbody",
                null,
                React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "td",
                        { className: "first-td", style: { verticalAlign: "top" } },
                        React.createElement(CodeView, { dom: this.state.proposer, shift: 2, width: 68 })
                    ),
                    React.createElement(
                        "td",
                        { className: "second-td", style: { verticalAlign: "top" } },
                        React.createElement(
                            "div",
                            null,
                            React.createElement(
                                "div",
                                { style: { "display": "inline-block", marginRight: "5px" } },
                                React.createElement(ThreadView, { title: "TX1", thread: this.state.tx1, model: this.state })
                            ),
                            React.createElement(
                                "div",
                                { style: { "display": "inline-block" } },
                                React.createElement(ThreadView, { title: "TX2", thread: this.state.tx2, model: this.state })
                            )
                        ),
                        React.createElement(SideView, { model: this.state })
                    )
                )
            )
        );
    }
});

},{"../stepbystep/view":10,"../yabandeh/ThreadView":11,"./RAMPModel":6,"./SideView":7}],6:[function(require,module,exports){
var dsl = require("../stepbystep/dsl");
var DB = require("./DB");
var KeyTable = require("./KeyTable");

var Statement = dsl.Statement;
var Abort = dsl.Abort;
var Seq = dsl.Seq;
var Cond = dsl.Cond;
var Fun = dsl.Fun;
var Call = dsl.Call;
var Return = dsl.Return;
var Each = dsl.Each;
var Nope = dsl.Nope;
var Skip = dsl.Skip;
var Shift = dsl.Shift;
var TML = require("../stepbystep/view").TML;

var model = require("../stepbystep/model");
var AppModel = model.AppModel;
var ThreadModel = model.ThreadModel;
var HashVar = model.HashVar;

var ramp_model = AppModel();
module.exports = ramp_model;

ramp_model.change_notify = function (fn, args) {
    fn.apply(ramp_model, args);
    ramp_model.notify();
};

ramp_model.set_sideview = function (type) {
    module.exports.side_view = type;
};

//ramp_model.change_notify(ramp_model.set_sideview, ["sql:prepare"])

module.exports.side_view = "db";

function db_prepare_clicked() {
    ramp_model.set_sideview("sql:prepare");
    ramp_model.notify();
};
function db_commit_clicked() {
    ramp_model.set_sideview("sql:commit");
    ramp_model.notify();
};
function db_get_clicked() {
    ramp_model.set_sideview("sql:get");
    ramp_model.notify();
};
function db_debts_clicked() {
    ramp_model.set_sideview("sql:debts");
    ramp_model.notify();
};
function db_finalize_clicked() {
    ramp_model.set_sideview("sql:finalize");
    ramp_model.notify();
};

var db = new DB();

db.prepare("denis", [{ key: { shard: "denis", key: "sam" }, txid: 0, value: 0, md: [] }, { key: { shard: "denis", key: "lisa" }, txid: 0, value: 0, md: [] }]);
db.prepare("sam", [{ key: { shard: "sam", key: "denis" }, txid: 0, value: 0, md: [] }, { key: { shard: "sam", key: "lisa" }, txid: 0, value: 0, md: [] }]);
db.prepare("lisa", [{ key: { shard: "lisa", key: "denis" }, txid: 0, value: 0, md: [] }, { key: { shard: "lisa", key: "sam" }, txid: 0, value: 0, md: [] }]);
db.commit("denis", [0]);
db.commit("sam", [0]);
db.commit("lisa", [0]);
db.proposers = [{ name: "proposer1", proposer_id: 0, n: 0 }, { name: "proposer2", proposer_id: 1, n: 0 }];

var __req = Fun("function req(query, ret) {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("query", ctx.query);
}), Each(function (ctx) {
    var sharded = {};
    ctx.query.forEach(function (key) {
        if (!sharded.hasOwnProperty(key.key.shard)) {
            sharded[key.key.shard] = [];
        }
        sharded[key.key.shard].push(key);
    });
    var items = [];
    for (var shard in sharded) {
        if (!sharded.hasOwnProperty(shard)) continue;
        items.push({
            shard: shard,
            values: sharded[shard]
        });
    }
    return items;
}, function (e) {
    return { s: e.shard, ks: e.values };
}, "query.group_by(x => shard(x.key)).flatMap((s, ks) => {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("ks", ctx.ks);
}), Statement(TML([TML.Text("return "), TML.Click("dbs[s].get(ks)", db_get_clicked), TML.Text(".map(x=>(x.key,x));")]), function (ctx) {
    db.get(ctx.s, ctx.ks).forEach(function (e) {
        ctx.__seed.__seed.ret.put(e.key, e);
    });
})]), "}).each((key,value) => { ret[key]=value; });")]), "}");

////////////////////////////////////////////////////////////

var __put_all = Fun("this.put_all = function(changes) {", Seq([Statement("var toptx = changes.map(x => x.txid).reduce(Math.max, 0);\n" + "this.n = Math.max(this.n, toptx / 10);\n" + "var txid = 100*(++this.n) + this.proposer_id;", function (ctx) {
    ctx.toptx = ctx.changes.map(function (x) {
        return x.txid;
    }).reduce(function (x, y) {
        return Math.max(x, y);
    }, 0);
    ctx.__self.n = Math.max(ctx.__self.n, ctx.toptx / 100);
    ctx.__self.n += 1;
    ctx.txid = 100 * ctx.__self.n + ctx.__self.proposer_id;
}), Statement("proposers.broadcast(this.n);", function (ctx) {
    module.exports.db.broadcast_ballot_number(ctx.__self.n);
}), Statement("var md = set(changes.map(x => x.key);\n" + "var by_shard = changes.map((key,value) => {\n" + "  key: key,\n" + "  txid: txid,\n" + "  value: value,\n" + "  md: md - { key }\n" + "}).group_by(x=>shard(x.key));", function (ctx) {
    ctx.md = ctx.changes.map(function (x) {
        return x.key;
    });
    ctx.group_by = {};
    for (var i = 0; i < ctx.changes.length; i++) {
        var key = ctx.changes[i].key.shard;
        if (!ctx.group_by.hasOwnProperty(key)) {
            ctx.group_by[key] = [];
        }
        ctx.group_by[key].push({
            key: ctx.changes[i].key,
            txid: ctx.txid,
            value: ctx.changes[i].value,
            md: ctx.md.filter(function (md) {
                return !(md.shard == ctx.changes[i].key.shard && md.key == ctx.changes[i].key.key);
            })
        });
    }
}), Each(function (ctx) {
    var arr = [];
    for (var shard in ctx.group_by) {
        if (!ctx.group_by.hasOwnProperty(shard)) continue;
        arr.push({ shard: shard, values: ctx.group_by[shard] });
    }
    return arr;
}, function (e) {
    return e;
}, "by_shard.each((shard,values) => {", Seq([Statement(TML([TML.Text(""), TML.Click("dbs[shard].prepare(values)", db_prepare_clicked), TML.Text(";")]), function (ctx) {
    db.prepare(ctx.shard, ctx.values);
})]), "});"), Skip(function (ctx) {
    ctx.shards = [];
    for (var shard in ctx.group_by) {
        if (!ctx.group_by.hasOwnProperty(shard)) {
            continue;
        }
        ctx.shards.push(shard);
    }
}), Each(function (ctx) {
    return ctx.shards;
}, function (e) {
    return { shard: e };
}, "by_shard.each((shard,_) => {", Seq([Statement(TML([TML.Text(""), TML.Click("dbs[shard].commit([txid])", db_commit_clicked), TML.Text(";")]), function (ctx) {
    db.commit(ctx.shard, [ctx.__seed.txid]);
})]), "});"), Each(function (ctx) {
    return ctx.shards;
}, function (e) {
    return { shard: e };
}, "by_shard.each((shard,_) => {", Seq([Statement(TML([TML.Text(""), TML.Click("dbs[shard].finalize([txid])", db_finalize_clicked), TML.Text(";")]), function (ctx) {
    db.finalize(ctx.shard, [ctx.__seed.txid]);
})]), "});")]), "};");

var __finalize = Fun("function finalize(values) {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("values", ctx.values);
}), Statement("var unfinished = values.when(x.is_final==false).flatMap(x => [\n" + "    {shard: shard(x.key), txid: x.txid}\n" + "] + x.md.map(y => {shard: shard(y), txid: x.txid}))\n" + "var by_shard = values.group_by(x => x.shard).map(\n" + "  (shard, values) => (shard, values.map(x => x.txid))\n" + ");", function (ctx) {
    var unfinished = [];
    for (var i = 0; i < ctx.values.length; i++) {
        if (ctx.values[i].is_final === false) {
            unfinished.push({
                shard: ctx.values[i].key.shard,
                txid: ctx.values[i].txid
            });
            ctx.values[i].md.forEach(function (md) {
                unfinished.push({
                    shard: md.shard,
                    txid: ctx.values[i].txid
                });
            });
        }
    }
    ctx.unfinished = unfinished;
    ctx.__thread.frame_var("unfinished", ctx.unfinished);
    var by_shard = {};
    var is_used = {};
    ctx.unfinished.forEach(function (x) {
        if (!by_shard.hasOwnProperty(x.shard)) {
            by_shard[x.shard] = [];
            is_used[x.shard] = {};
        }
        if (!is_used[x.shard].hasOwnProperty(x.txid)) {
            by_shard[x.shard].push(x.txid);
            is_used[x.shard][x.txid] = true;
        }
    });
    var groupped = [];
    for (var shard in by_shard) {
        if (!by_shard.hasOwnProperty(shard)) {
            continue;
        }
        groupped.push({ shard: shard, txids: by_shard[shard] });
    }
    ctx.by_shard = groupped;
    ctx.__thread.frame_var("by_shard", groupped);
}), Each(function (ctx) {
    return ctx.by_shard;
}, function (e) {
    return { shard: e.shard, txids: e.txids };
}, "by_shard.each((shard,txids) => {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("shard", ctx.shard);
    ctx.__thread.frame_var("txids", ctx.txids);
}), Statement(TML([TML.Text(""), TML.Click("dbs[shard].commit(txids)", db_commit_clicked), TML.Text(";")]), function (ctx) {
    db.commit(ctx.shard, ctx.txids);
})]), "});"), Each(function (ctx) {
    return ctx.by_shard;
}, function (e) {
    return { shard: e.shard, txids: e.txids };
}, "by_shard.each((shard,txids) => {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("shard", ctx.shard);
    ctx.__thread.frame_var("txids", ctx.txids);
}), Statement(TML([TML.Text(""), TML.Click("dbs[shard].finalize(txids)", db_finalize_clicked), TML.Text(";")]), function (ctx) {
    db.finalize(ctx.shard, ctx.txids);
})]), "});")]), "};");

var __get_all = Fun("this.get_all = function(keys) {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("keys", ctx.keys);
}), Statement("var ret = {};", function (ctx) {
    ctx.ret = new KeyTable();
    ctx.__thread.frame_var("ret", new HashVar(ctx.ret.as_obj()));
}), Call("req(keys.map(key=>{key: key, txid: null}), ret);", function (ctx) {
    return { query: ctx.keys.map(function (key) {
            return { key: key, txid: null };
        }) };
}, __req, function (ctx, ret) {
    ctx.__thread.frame_var("ret", new HashVar(ctx.ret.as_obj()));
}), Call("finalize(ret.values());", function (ctx) {
    return { values: ctx.ret.values() };
}, __finalize, function (ctx, ret) {}), Statement("var versions = [\n" + "  {key: md, txid: r.txid} | r in ret.values(), md in r.md\n" + "];\n" + "var latest = versions.aggr(x=>x.key, x=>x.txid, Math.max);\n" + "var newer = latest.when(\n" + "  (key, txid) => key in ret && txid > ret[key].txid\n" + ");", function (ctx) {
    var latest = new KeyTable(function () {
        return -1;
    });
    ctx.ret.forEach(function (r_key, r) {
        latest.put(r_key, Math.max(r.txid, latest.get(r_key)));
        for (var md_key in r.md) {
            if (!r.md.hasOwnProperty(md_key)) continue;
            var md = r.md[md_key];
            latest.put(md, Math.max(r.txid, latest.get(md)));
        }
    });
    var newer = [];
    ctx.ret.forEach(function (key, value) {
        if (latest.get(key) > value.txid) {
            newer.push({
                key: key,
                txid: latest.get(key)
            });
        }
    });
    ctx.newer = newer;
}), Call("req(newer.map((key, txid)=>{key: key, txid: txid}), ret);", function (ctx) {
    return { query: ctx.newer };
}, __req, function (ctx, ret) {}), Return("return ret;", function (ctx) {
    return ctx.ret;
}), __req, __finalize]), "};");

var __get_borrowers = Fun("function get_borrowers() {", Seq([Statement(TML([TML.Text("var keys = "), TML.Click("db[shard(person)].get_debts_of(person)", db_debts_clicked), TML.Text(";")]), function (ctx) {
    ctx.keys = db.get_debts(ctx.person);
    ctx.__thread.frame_var("keys", ctx.keys);
}), Statement("keys = keys.map(key => {\n" + "  {creditor: person, borrower: key.borrower}\n" + "})\n" + "var borrowers = {};", function (ctx) {
    var values = ctx.keys;
    var result = [];
    values.forEach(function (value) {
        result.push({ shard: value.key.shard, key: value.key.key });
    });
    ctx.keys = result;
    ctx.__thread.frame_var("keys", result);
    ctx.borrowers = {};
    ctx.__thread.frame_var("borrowers", new HashVar({}));
}), Call("proposer.get_all(keys).values().each(\n" + "  v => borrowers[v.key.borrower] = v\n" + ");", function (ctx) {
    return {
        keys: ctx.keys,
        __self: ctx.proposer
    };
}, __get_all, function (ctx, ret) {
    ret.forEach(function (key, value) {
        ctx.borrowers[value.key.key] = value;
    });
    ctx.__thread.frame_var("borrowers", new HashVar(ctx.borrowers));
}), Return("return borrowers;", function (ctx) {
    return ctx.borrowers;
})]), "}");

var __update = Fun("function update(proposer, person, changes) {", Seq([Skip(function (ctx) {
    ctx.__thread.frame_var("proposer", ctx.proposer.name);
    ctx.__thread.frame_var("person", ctx.person);
    ctx.__thread.frame_var("changes", ctx.changes);
}), Call("var borrowers = get_borrowers();", function (ctx) {
    return {
        proposer: ctx.proposer,
        person: ctx.person
    };
}, __get_borrowers, function (ctx, ret) {
    ctx.borrowers = ret;
    ctx.__thread.frame_var("borrowers", new HashVar(ret));
}), Statement("changes = changes.flatMap(x => [\n" + "  { key: { creditor: person, borrower: x.borrower },\n" + "    value: borrowers[x.borrower].value + x.changes,\n" + "    txid: borrowers[x.borrower].txid }, \n" + "  { key: { creditor: x.borrower, borrower: person },\n" + "    value: -(borrowers[x.borrower].value + x.changes),\n" + "    txid: borrowers[x.borrower].txid }\n" + "]);", function (ctx) {
    var changes = [];
    ctx.changes.forEach(function (change) {
        changes.push({
            key: { shard: ctx.person, key: change.borrower },
            value: ctx.borrowers[change.borrower].value + change.value,
            txid: ctx.borrowers[change.borrower].txid
        });
        changes.push({
            key: { shard: change.borrower, key: ctx.person },
            value: -(ctx.borrowers[change.borrower].value + change.value),
            txid: ctx.borrowers[change.borrower].txid
        });
    });
    ctx.changes = changes;
}), Call("proposer.put_all(changes);", function (ctx) {
    return {
        changes: ctx.changes,
        __self: ctx.proposer
    };
}, __put_all, function (ctx, ret) {}), __get_borrowers]), "}");

function make_core(put_all, get_all, update) {
    return Seq([Nope("function Proposer(proposers, proposer_id, n) {"), Shift(Seq([Nope("this.proposer_id = proposer_id;"), Nope("this.n = n;"), put_all, get_all])), Nope("}"), update]);
}

var __get_all_collapsed, __put_all_collapsed, __update_collapsed;

function expand_put() {
    module.exports.proposer = make_core(__put_all, __get_all_collapsed, __update_collapsed);
    module.exports.notify();
}

function expand_get() {
    module.exports.proposer = make_core(__put_all_collapsed, __get_all, __update_collapsed);
    module.exports.notify();
}

function expand_update() {
    module.exports.proposer = make_core(__put_all_collapsed, __get_all_collapsed, __update);
    module.exports.notify();
}

__put_all_collapsed = Nope(TML([TML.Text("this.put_all = function(changes) { "), TML.Click("...", expand_put), TML.Text(" };")]));

__get_all_collapsed = Nope(TML([TML.Text("this.get_all = function(keys) { "), TML.Click("...", expand_get), TML.Text(" };")]));

__update_collapsed = Nope(TML([TML.Text("function update(proposer, person, changes) { "), TML.Click("...", expand_update), TML.Text(" };")]));

module.exports.proposer = make_core(__put_all_collapsed, __get_all_collapsed, __update_collapsed);

////////////////////////////////////////////////////////////

module.exports.ticked = function (thread) {
    if (is_called_from(thread.ctx, __put_all)) {
        expand_put();
    } else if (is_called_from(thread.ctx, __get_all)) {
        expand_get();
    } else if (is_called_from(thread.ctx, __update)) {
        expand_update();
    } else {
        module.exports.notify();
    }
    function is_called_from(ctx, fun) {
        if (!ctx) return false;
        if (ctx.__fun === fun) return true;
        return is_called_from(ctx.__seed, fun);
    }
};

ramp_model.frames = [];
ramp_model.push_frame = function (thread) {
    ramp_model.frames.push({
        thread_id: thread.thread_id,
        thread: thread,
        vars: []
    });
};
ramp_model.pop_frame = function (thread) {
    var tail = [];
    while (true) {
        var frame = ramp_model.frames.pop();
        if (frame.thread_id == thread.thread_id) {
            break;
        }
        tail.push(frame);
    }
    while (tail.length > 0) {
        ramp_model.frames.push(tail.pop());
    }
};
ramp_model.frame_var = function (thread, name, obj) {
    for (var i = ramp_model.frames.length - 1; i >= 0; i--) {
        if (ramp_model.frames[i].thread_id == thread.thread_id) {
            for (var j = 0; j < ramp_model.frames[i].vars.length; j++) {
                if (ramp_model.frames[i].vars[j].name == name) {
                    ramp_model.frames[i].vars[j].obj = obj;
                    return;
                }
            }
            ramp_model.frames[i].vars.push({ name: name, obj: obj });
            return;
        }
    }
    throw "WTF?!";
};
ramp_model.has_frames_var = function () {
    var count = 0;
    module.exports.frames.forEach(function (frame) {
        count += frame.vars.length;
    });
    return count > 0;
};

////////////////

var __tx1 = get_tx("proposer1", "denis", [{ borrower: "sam", value: 5.68 }, { borrower: "lisa", value: -7 }]);

var __tx2 = get_tx("proposer2", "lisa", [{ borrower: "denis", value: 6 }, { borrower: "sam", value: -1 }]);

module.exports.db = db;
module.exports.gc = function () {
    this.db.gc();
    module.exports.notify();
};

module.exports.tx1 = ThreadModel(__tx1, module.exports, "0", 182, 25);
module.exports.tx2 = ThreadModel(__tx2, module.exports, "1", 51, 100);

function get_tx(proposer, person, changes) {
    var text = "update(" + proposer + ", \"" + person + "\", [\n";
    changes.forEach(function (change, i) {
        var c = i + 1 == changes.length ? "" : ",";
        text += "  {borrower: \"" + change.borrower + "\", value: " + change.value + "}" + c + "\n";
    });
    text += "]);";
    var proposer = db.proposers.filter(function (x) {
        return x.name == proposer;
    })[0];
    return Seq([Call(text, function (ctx) {
        return {
            person: person,
            changes: changes,
            proposer: proposer
        };
    }, __update, function (ctx, ret) {})]);
}

},{"../stepbystep/dsl":8,"../stepbystep/model":9,"../stepbystep/view":10,"./DB":2,"./KeyTable":4}],7:[function(require,module,exports){
var DBView = require("./DBView");
var HashVar = require("../stepbystep/model").HashVar;
var buildShadesMap = require("../stepbystep/view").buildShadesMap;

var GET_QUERY = "function get($key_txid_pairs) {\n" + "  A = (\n" + "    SELECT key, txid \n" + "    FROM $key_txid_pairs\n" + "    WHERE txid != NULL\n" + "  )\n" + "  B = (\n" + "    SELECT key\n" + "    FROM $key_txid_pairs\n" + "    WHERE txid == NULL\n" + "  )\n" + "  C = (\n" + "    SELECT B.key, c.txid \n" + "    FROM B LEFT JOIN Committed c \n" + "     ON c.key == B.key\n" + "  )\n" + "  D = A UNION C\n" + "  return (\n" + "    SELECT \n" + "      key, p.txid, value,\n" + "      md, is_final\n" + "    FROM Prepared p\n" + "    LEFT JOIN Committed c\n" + "      ON p.txid == c.txid\n" + "    WHERE (key, txid) in D\n" + "  )\n" + "}";

var PREPARE_QUERY = "function prepare($values) {\n" + "  INSERT INTO Prepared(\n" + "    key, txid, value, md\n" + "  ) SELECT key, txid, value, md\n" + "  FROM $values;\n" + "}";

var COMMIT_QUERY = "function commit($txids) {\n" + "  A = (\n" + "    SELECT key, txid, is_final\n" + "    FROM Prepared\n" + "    WHERE txid in $txid\n" + "  )\n" + "  Committed = (\n" + "    SELECT key, MAX(txid)\n" + "    FROM A UNION Committed\n" + "    GROUP BY key\n" + "  )\n" + "  UPDATE Committed\n" + "  SET\n" + "    is_final = false\n" + "  WHERE \n" + "    txid in $txids AND\n" + "    NOT(is_final)\n" + "}";

var FINALIZE_QUERY = "function finalize($txids) {\n" + "  UPDATE Committed\n" + "  SET\n" + "    is_final = true\n" + "  WHERE txid in $txids\n" + "}";

var DEBTS_QUERY = "function get_debts_of($person) {\n" + "  A = (\n" + "    SELECT key, txid\n" + "    FROM Committed \n" + "    WHERE key.creditor = $person\n" + "  )\n" + "  return (\n" + "    SELECT key, txid, value, md\n" + "    FROM Prepared\n" + "    WHERE (key, txid) in A\n" + "  )\n" + "}";

function tabler(record) {
    if (record.obj instanceof HashVar) {
        var records = [];
        for (var key in record.obj.obj) {
            if (!record.obj.obj.hasOwnProperty(key)) continue;
            records.push({ key: key, value: record.obj.obj[key] });
        }
        if (records.length == 0) {
            return React.createElement(
                "span",
                null,
                "{}"
            );
        } else {
            var tableInfo = build_table_info(records[0].value, null, null);
            return React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    tableInfo.get_header().map(function (tr) {
                        return React.createElement(
                            "tr",
                            null,
                            React.createElement("td", null),
                            tr
                        );
                    }),
                    records.map(function (obj) {
                        var row = [React.createElement(
                            "td",
                            null,
                            obj.key
                        )];
                        tableInfo.render_row(obj.value, row);
                        return React.createElement(
                            "tr",
                            null,
                            row
                        );
                    })
                )
            );
        }
    } else {
        if (record.obj.length == 0) {
            return React.createElement(
                "span",
                null,
                "[]"
            );
        } else {
            var tableInfo = build_table_info(record.obj[0], null, null);
            return React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    tableInfo.get_header().map(function (tr) {
                        return React.createElement(
                            "tr",
                            null,
                            tr
                        );
                    }),
                    record.obj.map(function (obj) {
                        var row = [];
                        tableInfo.render_row(obj, row);
                        return React.createElement(
                            "tr",
                            null,
                            row
                        );
                    })
                )
            );
        }
    }

    function TableInfo(is_leaf, name, prop) {
        this.is_leaf = is_leaf;
        this.name = name;
        this.prop = prop;
        this.children = [];
        this.spans = is_leaf ? 1 : 0;
        this.lvl = 0;
        this.get_header = function () {
            var by_lvl = this.collect_by_lvl([]);
            var last = null;
            var table = [];
            var tr = [];
            by_lvl.forEach(function (node) {
                if (last == null) {
                    last = node.lvl;
                }
                if (last != node.lvl) {
                    table.push(tr);
                    tr = [];
                    last = node.lvl;
                }
                tr.push(node);
                //var name = node.name == null ? "" : node.name;
                //tr.push(<td colSpan={node.spans}>{name}</td>);
            });
            table.push(tr);
            table = table.filter(function (tr) {
                return !tr.every(function (cell) {
                    return cell.name == null;
                });
            }).map(function (tr) {
                return tr.map(function (node) {
                    var name = node.name == null ? "" : node.name;
                    return React.createElement(
                        "td",
                        { colSpan: node.spans },
                        name
                    );
                });
            });
            return table;
        };
        this.render_row = function (obj, collector) {
            if (this.is_leaf) {
                collector.push(React.createElement(
                    "td",
                    null,
                    obj[this.prop]
                ));
            } else {
                if (this.prop != null) {
                    obj = obj[this.prop];
                }
                this.children.forEach(function (child) {
                    child.render_row(obj, collector);
                });
            }
        };
        this.collect_by_lvl = function (list) {
            var plan = [this];
            var i = 0;
            while (i < plan.length) {
                var e = plan[i];
                list.push(e);
                e.children.forEach(function (child) {
                    plan.push(child);
                });
                i++;
            }
            return list;
        };
    }

    function build_table_info(obj, name, prop) {
        if (typeof obj != "object" || Array.isArray(obj)) {
            return new TableInfo(true, name, prop);
        } else {
            var root = new TableInfo(false, name, prop);
            var children = [];
            for (var key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                var child = build_table_info(obj[key], key, key);
                root.lvl = Math.max(root.lvl, child.lvl + 1);
                root.spans += child.spans;
                children.push(child);
            }
            children.forEach(function (child) {
                root.children.push(fill_skips(root.lvl - 1, child));
            });
            return root;
        }

        function fill_skips(lvl, node) {
            if (lvl < node.lvl) throw "WTF?!";
            if (lvl == node.lvl) return node;
            var filler = new TableInfo(false, null);
            filler.lvl = lvl;
            filler.children.push(fill_skips(lvl - 1, node));
            return filler;
        }
    }
}

var Vars = React.createClass({
    displayName: "Vars",

    render: function () {
        return React.createElement(
            "div",
            { className: "varview" },
            React.createElement(
                "table",
                null,
                React.createElement(
                    "tbody",
                    null,
                    this.props.vars.map(function (record) {
                        var color = "hsl(" + record.h + "," + record.s + "%," + record.l + "%" + ")";
                        return React.createElement(
                            "tr",
                            { style: { "backgroundColor": color } },
                            to_tds(record)
                        );
                    })
                )
            )
        );

        function to_tds(record) {
            if (typeof record.obj == "string") {
                return [React.createElement(
                    "td",
                    null,
                    record.name
                ), React.createElement(
                    "td",
                    null,
                    record.obj
                )];
            }
            if (Array.isArray(record.obj) && record.obj.length > 0 && typeof record.obj[0] == "number") {
                return [React.createElement(
                    "td",
                    null,
                    record.name
                ), React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "table",
                        null,
                        React.createElement(
                            "tbody",
                            null,
                            record.obj.map(function (obj) {
                                return React.createElement(
                                    "tr",
                                    null,
                                    React.createElement(
                                        "td",
                                        null,
                                        obj
                                    )
                                );
                            })
                        )
                    )
                )];
            }
            if (Array.isArray(record.obj) || record.obj instanceof HashVar) {
                return [React.createElement(
                    "td",
                    null,
                    record.name
                ), React.createElement(
                    "td",
                    null,
                    tabler(record)
                )];
            }
            return [React.createElement(
                "td",
                null,
                record.name
            ), React.createElement(
                "td",
                null,
                JSON.stringify(record.obj)
            )];
        }
    }
});

module.exports = React.createClass({
    displayName: "exports",

    dataClicked: function () {
        this.props.model.set_sideview("db");
        this.props.model.notify();
    },
    varsClicked: function () {
        this.props.model.set_sideview("vars");
        this.props.model.notify();
    },
    render: function () {
        var side_view = this.props.model.side_view;
        while (true) {
            var menu = [];
            if (side_view == "db") {
                menu.push(React.createElement(
                    "span",
                    null,
                    "Data"
                ));
            } else {
                menu.push(React.createElement(
                    "a",
                    { href: "#", onClick: this.dataClicked },
                    "Data"
                ));
            }
            if (side_view == "vars") {
                menu.push(React.createElement(
                    "span",
                    null,
                    "Vars"
                ));
            } else {
                if (this.props.model.has_frames_var()) {
                    menu.push(React.createElement(
                        "a",
                        { href: "#", onClick: this.varsClicked },
                        "Vars"
                    ));
                }
            }

            if (side_view == "db") {
                return React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "div",
                        null,
                        menu
                    ),
                    React.createElement(DBView, { model: this.props.model })
                );
            } else if (side_view == "vars") {
                var frames = this.props.model.frames;

                var deep_by_thread = {};
                for (var i = 0; i < frames.length; i++) {
                    var frame = frames[i];
                    if (!deep_by_thread.hasOwnProperty(frame.thread.thread_id)) {
                        deep_by_thread[frame.thread.thread_id] = {};
                    }
                    deep_by_thread[frame.thread.thread_id][i] = true;
                }
                var shades_by_thread = {};
                for (var thread in deep_by_thread) {
                    if (!deep_by_thread.hasOwnProperty(thread)) continue;
                    shades_by_thread[thread] = buildShadesMap(deep_by_thread[thread]);
                }

                var vars = [];
                for (var i = 0; i < frames.length; i++) {
                    var frame = frames[i];
                    var h = frame.thread.color.h;
                    var s = frame.thread.color.s;
                    var l = 90.0 - shades_by_thread[frame.thread.thread_id][i] * 40;
                    frame.vars.forEach(function (record) {
                        vars.push({
                            name: record.name,
                            obj: record.obj,
                            h: h,
                            s: s,
                            l: l
                        });
                    });
                }

                vars = reverse(vars);

                if (vars.length == 0) {
                    side_view = "db";
                    continue;
                } else {
                    return React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            null,
                            menu
                        ),
                        React.createElement(Vars, { vars: vars })
                    );
                }
            } else {
                var query = null;
                if (side_view == "sql:get") {
                    query = GET_QUERY;
                } else if (side_view == "sql:prepare") {
                    query = PREPARE_QUERY;
                } else if (side_view == "sql:commit") {
                    query = COMMIT_QUERY;
                } else if (side_view == "sql:debts") {
                    query = DEBTS_QUERY;
                } else if (side_view == "sql:finalize") {
                    query = FINALIZE_QUERY;
                }
                if (query != null) {
                    return React.createElement(
                        "div",
                        null,
                        React.createElement(
                            "div",
                            null,
                            menu
                        ),
                        React.createElement(
                            "pre",
                            null,
                            query
                        )
                    );
                }
            }
            return [];
        }
    }
});

function reverse(arr) {
    arr = Array.prototype.slice.call(arr);
    arr.reverse();
    return arr;
}

},{"../stepbystep/model":9,"../stepbystep/view":10,"./DBView":3}],8:[function(require,module,exports){
module.exports = {
    Statement: Statement,
    Abort: Abort,
    Seq: Seq,
    Cond: Cond,
    Fun: Fun,
    Call: Call,
    Return: Return,
    Each: Each,
    Nope: Nope,
    Shift: Shift,
    Skip: Skip,
    Wormhole: Wormhole
};

/////////////////////

function Step(pre, action, post) {
    return {
        isStep: true,
        pre: pre,
        post: post,
        get_action: function () {
            return action;
        },
        bind: function (g) {
            return Step(this.pre, function (ctx) {
                var phase = action(ctx);
                return Phase(phase.step.bind(g), phase.ctx);
            }.bind(this), this.post);
        }
    };
}

function Jump(action) {
    return {
        isJump: true,
        get_action: function () {
            return action;
        },
        bind: function (g) {
            return Jump(function (ctx) {
                var phase = action(ctx);
                return Phase(phase.step.bind(g), phase.ctx);
            });
        }
    };
}

function AsReturn(step) {
    return {
        isReturn: true,
        step: step,
        bind: function (g) {
            if (!g.isAccept) return this;
            return step.bind(g.step);
        }
    };
}

function AsAccept(step) {
    return {
        isAccept: true,
        step: step,
        extract: function () {
            return step;
        },
        bind: function (g) {
            return AsAccept(step.bind(g));
        }
    };
}

function Unit() {
    return {
        isUnit: true,
        bind: function (g) {
            return g;
        }
    };
}

function Zero() {
    return {
        isZero: true,
        bind: function (g) {
            return this;
        }
    };
}

function Phase(step, ctx) {
    return {
        step: step,
        ctx: ctx
    };
}

/////////////////////

function bind(f, g) {
    return f.bind(g);
}

function unit(x) {
    return x.unit();
}

/////////////////////

function none() {}

function marker(x) {
    return function (thread) {
        if (!x.marked.hasOwnProperty(thread.id)) {
            x.marked[thread.thread_id] = {
                thread: thread,
                hits: []
            };
        }
        x.marked[thread.thread_id].hits.push(thread.ts);
        thread.trace[thread.ts] = x;
    };
}

function unmarker(x) {
    return function (thread) {
        var ts = x.marked[thread.thread_id].hits.pop();
        if (x.marked[thread.thread_id].hits.length == 0) {
            delete x.marked[thread.thread_id];
        }
        delete thread.trace[ts];
    };
}

/////////////////////

function Wormhole() {
    this.pres = [];
    this.posts = [];
    this.pre = function () {
        this.pres.forEach(function (x) {
            x();
        });
    };
    this.post = function () {
        this.posts.forEach(function (x) {
            x();
        });
    };
    this.reg = function (stmnt) {
        var wh = this;
        var step = stmnt.unit();
        this.pres.push(step.pre);
        this.posts.push(step.post);
        step.unit = function () {
            return Step(wh.pre.bind(wh), step.action, wh.post.bind(wh));
        };
        return step;
    };
}

function Statement(view, action) {
    var self = {
        view: view,
        action: action,
        marked: {},
        unit: function () {
            return Step(marker(self), function (ctx) {
                action(ctx);
                return Phase(Unit(), ctx);
            }, unmarker(self));
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, self.view);
            return writer;
        }
    };
    return self;
}

function Skip(action) {
    var self = {
        action: action,
        unit: function () {
            return Jump(function (ctx) {
                action(ctx);
                return Phase(Unit(), ctx);
            });
        },
        accept_writer: function (offset, writer, shift) {
            return writer;
        }
    };
    return self;
}

function Return(view, selector) {
    var self = {
        view: view,
        selector: selector,
        marked: {},
        unit: function () {
            return AsReturn(Step(marker(self), function (ctx) {
                ctx.__ret = self.selector(ctx);
                return Phase(Unit(), ctx);
            }, unmarker(self)));
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, self.view);
            return writer;
        }
    };
    return self;
}

function Abort(view) {
    var self = {
        marked: {},
        view: view,
        unit: function () {
            return Step(marker(self), function (ctx) {
                return Phase(Zero(), ctx);
            }, unmarker(self));
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, view);
            return writer;
        }
    };
    return self;
}

function Seq(statements) {
    var self = {
        statements: statements,
        unit: function () {
            return self.statements.map(unit).reduce(bind, Unit());
        },
        accept_writer: function (offset, writer, shift) {
            for (var i = 0; i < self.statements.length; i++) {
                self.statements[i].accept_writer(offset, writer, shift);
            }
            return writer;
        }
    };
    return self;
}

function Cond(cond_view, predicate, body, alt) {
    var self = {
        cond_view: cond_view,
        predicate: predicate,
        body: body,
        alt: alt,
        marked: {},
        unit: function () {
            return Step(marker(self), function (ctx) {
                if (predicate(ctx)) {
                    return Phase(body.unit(), ctx);
                } else {
                    if (alt) {
                        return Phase(alt.unit(), ctx);
                    } else {
                        return Phase(Unit(), ctx);
                    }
                }
            }, unmarker(self));
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, "if (" + cond_view + ") {");
            body.accept_writer(offset + shift, writer, shift);
            if (alt) {
                writer.write(false, offset, "} else {");
                alt.accept_writer(offset + shift, writer, shift);
                writer.write(false, offset, "}");
            } else {
                writer.write(false, offset, "}");
            }
            return writer;
        }
    };
    return self;
}

function Fun(begin, body, end) {
    var self = {
        signature: begin,
        body: body,
        end: end,
        unit: function () {
            return Unit();
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(false, offset, begin);
            body.accept_writer(offset + shift, writer, shift);
            writer.write(false, offset, end);
            return writer;
        }
    };
    return self;
}

function Each(selector, pack, begin, body, end) {
    var self = {
        selector: selector,
        pack: pack,
        begin: begin,
        body: body,
        end: end,
        marked: {},
        unit: function () {
            return Step(marker(self), function (ctx) {
                var xs = selector(ctx);
                var arr = [];
                xs.forEach(function (x) {
                    arr.push(x);
                });
                if (xs.length == 0) {
                    return Phase(Unit(), ctx);
                } else {
                    var tail = Step(marker(self), function (ctx) {
                        ctx.__thread.pop_frame();
                        return Phase(Unit(), ctx.__seed);
                    }, unmarker(self));
                    for (var i = xs.length - 1; i >= 0; i--) {
                        tail = function (item) {
                            var repack = Jump(function (ctx) {
                                ctx.__thread.pop_frame();
                                var packed = pack(item);
                                packed.__thread = ctx.__thread;
                                packed.__seed = ctx.__seed;
                                ctx.__thread.push_frame();
                                return Phase(Unit(), packed);
                            });
                            return repack.bind(body.unit()).bind(tail);
                        }(xs[i]);
                    }
                    ctx.__thread.push_frame();
                    return Phase(tail, { __seed: ctx, __thread: ctx.__thread });
                }
            }, unmarker(self));
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, begin);
            body.accept_writer(offset + shift, writer, shift);
            writer.write(self.marked, offset, end);
            return writer;
        }
    };

    return self;
}

function Call(view, pack, fun, unpack) {
    var self = {
        view: view,
        pack: pack,
        fun: fun,
        unpack: unpack,
        marked: {},
        unit: function () {
            var call = Step(marker(self), function (ctx) {
                ctx.__thread.push_frame();
                var sub = pack(ctx);
                sub.__seed = ctx;
                sub.__fun = fun;
                sub.__thread = ctx.__thread;
                return Phase(fun.body.unit(), sub);
            }, none);
            var accept = AsAccept(Jump(function (ctx) {
                var seed = ctx.__seed;
                var ret = ctx.__ret;
                ctx.__thread.pop_frame();
                unpack(seed, ret);
                return Phase(Unit(), seed);
            }));
            var pause = Step(none, function (ctx) {
                return Phase(Unit(), ctx);
            }, unmarker(self));
            return call.bind(accept).bind(pause);
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(self.marked, offset, view);
            return writer;
        }
    };

    return self;
}

function Nope(view) {
    var self = {
        view: view,
        unit: function () {
            return Unit();
        },
        accept_writer: function (offset, writer, shift) {
            writer.write(false, offset, view);
            return writer;
        }
    };
    return self;
}

function Shift(body) {
    var self = {
        body: body,
        unit: function () {
            return Unit();
        },
        accept_writer: function (offset, writer, shift) {
            body.accept_writer(offset + shift, writer, shift);
            return writer;
        }
    };
    return self;
}

},{}],9:[function(require,module,exports){
module.exports = {
    ThreadModel: ThreadModel,
    AppModel: AppModel,
    HashVar: HashVar
};

function HashVar(obj) {
    this.obj = obj;
}

function ThreadModel(entry_point, app_model, thread_id, h, s) {
    var self = {
        thread_id: thread_id,
        is_active: false,
        was_active: false,
        was_aborted: false,
        thread: entry_point,
        color: { h: h, s: s },
        ts: 0,
        trace: {},
        step: {},

        push_frame: function () {
            app_model.push_frame(self);
        },
        pop_frame: function () {
            app_model.pop_frame(self);
        },
        frame_var: function (name, obj) {
            app_model.frame_var(self, name, obj);
        },
        init: function () {
            self.was_active = true;
            self.was_aborted = false;
            self.step = self.thread.unit();
            self.ctx = {
                __thread: self
            };

            while (self.step.isJump || self.step.isAccept) {
                while (self.step.isJump) {
                    var phase = self.step.get_action()(self.ctx);
                    self.ctx = phase.ctx;
                    self.step = phase.step;
                }
                if (self.step.isAccept) {
                    self.step = self.step.extract();
                }
            }

            if (self.step.isStep) {
                self.ts += 1;
                self.is_active = true;
                self.step.pre(self);
            }
            app_model.ticked(self);
        },
        unselect: function () {
            var trace = [];
            for (var ts in self.trace) {
                if (!self.trace.hasOwnProperty(ts)) {
                    continue;
                }
                trace.push(ts);
            }
            trace.forEach(function (ts) {
                delete self.trace[ts].marked[self.thread_id];
                delete self.trace[ts];
            });
        },
        abort: function () {
            self.unselect();
            self.was_aborted = true;
            self.is_active = false;
            app_model.notify();
        },
        iter: function () {
            if (self.step.isStep) {
                var phase = self.step.get_action()(self.ctx);
                self.step.post(self);
                self.ctx = phase.ctx;
                self.step = phase.step;
                while (self.step.isJump || self.step.isAccept) {
                    while (self.step.isJump) {
                        var phase = self.step.get_action()(self.ctx);
                        self.ctx = phase.ctx;
                        self.step = phase.step;
                    }
                    if (self.step.isAccept) {
                        self.step = self.step.extract();
                    }
                }
            }
            if (self.step.isStep) {
                self.ts += 1;
                self.step.pre(self);
            } else {
                if (self.step.isZero) {
                    self.was_aborted = true;
                }
                self.is_active = false;
                self.unselect();
            }
            app_model.ticked(self);
        }
    };
    return self;
}

function AppModel() {
    var app_model = {
        on_state_updated: null,
        notify: function () {
            if (app_model.on_state_updated != null) {
                app_model.on_state_updated(app_model);
            }
        }
    };
    return app_model;
}

},{}],10:[function(require,module,exports){
module.exports.TML = function (tml_parts) {
    return {
        is_tml: true,
        parts: tml_parts
    };
};
module.exports.TML.Text = function (x) {
    return { is_text: true, text: x };
};
module.exports.TML.Click = function (x, f) {
    return { is_click: true, text: x, f: f };
};

module.exports.CodeView = React.createClass({
    displayName: "CodeView",

    renderCodeDOMRawHTML: function (codeDOM) {
        var shift = 4;
        if (this.props.shift) {
            shift = this.props.shift;
        }
        return codeDOM.accept_writer(0, HtmlCodeWriter(), shift).get(this.props.width);
    },
    render: function () {
        return React.createElement(
            "div",
            { className: "codeView" },
            this.renderCodeDOMRawHTML(this.props.dom)
        );
    }
});

module.exports.buildShadesMap = buildShadesMap;

function buildShadesMap(set) {
    var tss = [];
    var ts_pos = {};
    for (var ts in set) {
        if (!set.hasOwnProperty(ts)) {
            continue;
        }
        if (!set[ts]) {
            continue;
        }
        tss.push(parseInt(ts));
    }
    tss = tss.sort(function (x, y) {
        return x - y;
    });
    for (var i = 0; i < tss.length; i++) {
        ts_pos[tss[i]] = Math.exp(1.0 + i) / Math.exp(tss.length);
    }
    return ts_pos;
}

function HtmlCodeWriter() {
    var self = {
        lines: [],
        write: function (marked, offset, line) {
            var off = repeat(" ", offset);

            if (line.is_tml) {
                var parts = [];

                for (var i = 0; i < line.parts.length; i++) {
                    var text = line.parts[i].text;
                    text = text.replace(/\n/g, "\n" + off);
                    if (i == 0) {
                        text = off + text;
                    }
                    if (line.parts[i].is_click) {
                        parts.push(React.createElement(
                            "span",
                            { className: "code_link", onClick: line.parts[i].f },
                            text
                        ));
                    } else if (line.parts[i].is_text) {
                        parts.push(React.createElement(
                            "span",
                            null,
                            text
                        ));
                    }
                }
                line = parts;
            } else {
                line = [React.createElement(
                    "span",
                    null,
                    off + line.replace(/\n/g, "\n" + off)
                )];
            }

            var h = 0;
            var s = 0;
            var l = 0;
            var c = 0;

            for (var thread_id in marked) {
                if (!marked.hasOwnProperty(thread_id)) {
                    continue;
                }
                var thread = marked[thread_id].thread;
                var ts_pos = buildShadesMap(thread.trace);
                var hit = -1;
                marked[thread_id].hits.forEach(function (x) {
                    hit = Math.max(hit, x);
                });
                if (hit != -1) {
                    h += thread.color.h;
                    s += thread.color.s;
                    l += 90.0 - ts_pos[hit] * 40;
                    c += 1;
                }
            }

            if (c > 0) {
                self.lines.push({
                    is_current: true,
                    color: { h: Math.floor(h / c), s: Math.floor(s / c), l: Math.floor(l / c) },
                    text: line
                });
            } else {
                self.lines.push({
                    is_current: false,
                    text: line
                });
            }
        },
        get: function (width) {
            var pres = [];
            var text = [];
            for (var i = 0; i < self.lines.length; i++) {
                var isLast = i == self.lines.length - 1;
                var line = self.lines[i];
                if (line.is_current) {
                    var color = "hsl(" + line.color.h + "," + line.color.s + "%," + line.color.l + "%" + ")";

                    pres.push(React.createElement(
                        "pre",
                        null,
                        text
                    ));
                    if (isLast) {
                        pres.push(React.createElement(
                            "pre",
                            { style: { "backgroundColor": color } },
                            line.text
                        ));
                    } else {
                        pres.push(React.createElement(
                            "pre",
                            { style: { "backgroundColor": color } },
                            line.text,
                            React.createElement(
                                "span",
                                null,
                                "\n"
                            )
                        ));
                    }
                    text = [];
                } else {
                    text.push(line.text);
                    if (!isLast) {
                        text.push(React.createElement(
                            "span",
                            null,
                            "\n"
                        ));
                    }
                }
            }
            if (width) {
                pres.push(React.createElement(
                    "pre",
                    { style: { width: "" + width + "ch" } },
                    text
                ));
            } else {
                pres.push(React.createElement(
                    "pre",
                    null,
                    text
                ));
            }
            return pres;
        }
    };
    return self;
    function active_threads(threads) {
        var active = [];
        for (var x in threads) {
            if (threads.hasOwnProperty(x)) {
                if (threads[x]) {
                    active.push("" + x);
                }
            }
        }
        return active;
    }
    function repeat(text, n) {
        var off = "";
        for (var i = 0; i < n; i++) {
            off += text;
        }
        return off;
    }
}

},{}],11:[function(require,module,exports){
var view = require("../stepbystep/view");
var CodeView = view.CodeView;

var ThreadControl = React.createClass({
    displayName: "ThreadControl",

    nextHandler: function () {
        this.props.thread.iter();
    },
    abortHandler: function () {
        this.props.thread.abort();
    },
    rerunHandler: function () {
        this.props.thread.init();
    },
    render: function () {
        var button = null;
        if (this.props.thread.is_active) {
            return React.createElement(
                "span",
                { className: "threadControl" },
                React.createElement(
                    "button",
                    { onClick: this.nextHandler },
                    "Step"
                ),
                React.createElement(
                    "button",
                    { onClick: this.abortHandler },
                    "Abort"
                )
            );
        } else {
            var text = "";
            if (this.props.thread.was_active) {
                button = React.createElement(
                    "button",
                    { onClick: this.rerunHandler },
                    "Restart"
                );
                if (this.props.thread.was_aborted) {
                    text = "Aborted";
                } else {
                    text = "Executed";
                }
            } else {
                button = React.createElement(
                    "button",
                    { onClick: this.rerunHandler },
                    "Start"
                );
            }
            return React.createElement(
                "span",
                { className: "threadControl" },
                button,
                React.createElement(
                    "span",
                    null,
                    text
                )
            );
        }
    }
});

module.exports = React.createClass({
    displayName: "exports",

    render: function () {
        return React.createElement(
            "div",
            { className: "info-block threadview" },
            React.createElement(
                "h3",
                null,
                this.props.title,
                " ",
                React.createElement(ThreadControl, { thread: this.props.thread })
            ),
            React.createElement(CodeView, { dom: this.props.thread.thread })
        );
    }
});

},{"../stepbystep/view":10}]},{},[1]);
