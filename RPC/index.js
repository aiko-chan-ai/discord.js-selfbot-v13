module.exports = (function (e) {
    var t = {};
    function s(r) {
      if (t[r]) return t[r].exports;
      var i = (t[r] = { i: r, l: !1, exports: {} });
      return e[r].call(i.exports, i, i.exports, s), (i.l = !0), i.exports;
    }
    return (
      (s.m = e),
      (s.c = t),
      (s.d = function (e, t, r) {
        s.o(e, t) || Object.defineProperty(e, t, { enumerable: !0, get: r });
      }),
      (s.r = function (e) {
        "undefined" != typeof Symbol &&
          Symbol.toStringTag &&
          Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }),
          Object.defineProperty(e, "__esModule", { value: !0 });
      }),
      (s.t = function (e, t) {
        if ((1 & t && (e = s(e)), 8 & t)) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var r = Object.create(null);
        if (
          (s.r(r),
          Object.defineProperty(r, "default", { enumerable: !0, value: e }),
          2 & t && "string" != typeof e)
        )
          for (var i in e)
            s.d(
              r,
              i,
              function (t) {
                return e[t];
              }.bind(null, i)
            );
        return r;
      }),
      (s.n = function (e) {
        var t =
          e && e.__esModule
            ? function () {
                return e.default;
              }
            : function () {
                return e;
              };
        return s.d(t, "a", t), t;
      }),
      (s.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t);
      }),
      (s.p = "/assets/"),
      s((s.s = 0))
    );
  })([
    function (e, t, s) {
      "use strict";
      const r = s(1),
        i = s(9),
        n = s(10);
      var o = ["PLAYING", "STREAMING", "LISTENING", "WATCHING"],
        a = [0, 1, 2, 3],
        l = [].concat(a).concat(o);
      async function u(e) {
        if (!e || "string" != typeof e)
          throw new c(
            `'${e}' không phải là ID Application Discord. Typeof: <string>`
          );
        let t = await r(i.default.discord().application(e).assets(), {
          headers: {
            "User-Agent": i.default.ua,
            "accept-language": i.default.acceptedLangs,
          },
        });
        if (200 !== t.status) {
          let e,
            s = await t.text();
          if (!s) throw new c("Lỗi không xác định: " + t.status + " " + t.statusText);
          try {
            e = JSON.parse(s);
          } catch (e) {
            throw new c(s);
          }
          if (e.message) throw new c(e.message);
          if (e.application_id) throw new c(e.application_id[0]);
          throw new c(JSON.stringify(e));
        }
        return await t.json();
      }
      class c extends Error {
        constructor() {
          super(...arguments), (this.name = "RpcError");
        }
      }
      class h {
        constructor(e, t = !1) {
          (this.game = null), (this.game = e || null), t && this.lock();
        }
        lock() {
          Object.freeze(this.game);
        }
        toDiscord() {
          return { game: this.game };
        }
        toObject() {
          return this.game;
        }
        toString() {
          return this.game
            ? `${this.game.name}${
                this.game.application_id
                  ? " (" + this.game.application_id + ")"
                  : ""
              } `
            : "No game";
        }
        setName(e) {
          return this.verifyNull(), (this.game.name = e), this;
        }
        setApplicationId(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.application_id, this)
              : ((this.game.application_id = e), this)
          );
        }
        setType(e) {
          let t = 0;
          if ("string" == typeof e) {
            if (!o.includes(e))
              throw new c(
                `'${e}' không phải là Presence hợp lệ: ${l.join(
                  ", "
                )}`
              );
            t = o.indexOf(e);
          } else t = e;
          return this.verifyNull(), (this.game.type = t), this;
        }
        setUrl(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.url, this)
              : ((this.game.url = e), this)
          );
        }
        setDetails(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.details, this)
              : ((this.game.details = e), this)
          );
        }
        setState(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.state, this)
              : ((this.game.state = e), this)
          );
        }
        setSyncId(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.sync_id, this)
              : ((this.game.sync_id = e), this)
          );
        }
        setId(e) {
          return (
            this.verifyNull(),
            null === e ? (delete this.game.id, this) : ((this.game.id = e), this)
          );
        }
        setSessionId(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.session_id, this)
              : ((this.game.session_id = e), this)
          );
        }
        setParty(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.party, this)
              : ((this.game.party = e), this)
          );
        }
        setFlags(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.flags, this)
              : ((this.game.flags = e), this)
          );
        }
        setCreatedAt(e) {
          return (
            this.verifyNull(),
            null === e
              ? (delete this.game.created_at, this)
              : ((this.game.created_at = e), this)
          );
        }
        setAssets(e) {
          this.verifyNull();
          let t = {
            setLargeImage: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.large_image = e), t
              );
            }.bind(this),
            setSmallImage: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.small_image = e), t
              );
            }.bind(this),
            setLargeText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.large_text = e), t
              );
            }.bind(this),
            setSmallText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.small_text = e), t
              );
            }.bind(this),
            setNull: function () {
              return (this.game.assets = null), t;
            }.bind(this),
          };
          return e(t), this;
        }
        setAssetsLargeImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.large_image, this)
              : ((this.game.assets.large_image = e), this)
          );
        }
        setAssetsSmallImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.small_image, this)
              : ((this.game.assets.small_image = e), this)
          );
        }
        setAssetsLargeText(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.large_text, this)
              : ((this.game.assets.large_text = e), this)
          );
        }
        setAssetsSmallText(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.small_text, this)
              : ((this.game.assets.small_text = e), this)
          );
        }
        setStartTimestamp(e) {
          return (
            this.verifyNull(),
            this.verifyNullTimestamps(),
            null === e
              ? (delete this.game.timestamps.start, this)
              : ((this.game.timestamps.start = e), this)
          );
        }
        setEndTimestamp(e) {
          return (
            this.verifyNull(),
            this.verifyNullTimestamps(),
            null === e
              ? (delete this.game.timestamps.end, this)
              : ((this.game.timestamps.end = e), this)
          );
        }
        setPartySize(e) {
          return (
            this.verifyNull(),
            this.verifyNullParty(),
            null === e
              ? (delete this.game.party.size, this)
              : ((this.game.party.size = e), this)
          );
        }
        setPartyId(e) {
          return (
            this.verifyNull(),
            this.verifyNullParty(),
            null === e
              ? (delete this.game.party.id, this)
              : ((this.game.party.id = e), this)
          );
        }
        setJoinSecret(e) {
          return (
            this.verifyNull(),
            this.verifyNullSecrets(),
            null === e
              ? (delete this.game.secrets.join, this)
              : ((this.game.secrets.join = e), this)
          );
        }
        setSpectateSecret(e) {
          return (
            this.verifyNull(),
            this.verifyNullSecrets(),
            null === e
              ? (delete this.game.secrets.spectate, this)
              : ((this.game.secrets.spectate = e), this)
          );
        }
        setMatch(e) {
          return (
            this.verifyNull(),
            this.verifyNullSecrets(),
            null === e
              ? (delete this.game.secrets.match, this)
              : ((this.game.secrets.match = e), this)
          );
        }
        setSecrets(e) {
          return (
            this.verifyNull(),
            this.verifyNullSecrets(),
            null === e
              ? (delete this.game.secrets, this)
              : ((this.game.secrets = e), this)
          );
        }
        setTwitchAssets(e) {
          this.verifyNull();
          let t = {
            setLargeImage: function (e) {
              return (
                this.verifyNullAssets(),
                (this.game.assets.large_image =
                  "twitch:" + e.replace(/twitch\:/g, "")),
                t
              );
            }.bind(this),
            setSmallImage: function (e) {
              return (
                this.verifyNullAssets(),
                (this.game.assets.small_image =
                  "twitch:" + e.replace(/twitch\:/g, "")),
                t
              );
            }.bind(this),
            setLargeText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.large_text = e), t
              );
            }.bind(this),
            setSmallText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.small_text = e), t
              );
            }.bind(this),
            setNull: function () {
              return (this.game.assets = null), t;
            }.bind(this),
          };
          return e(t), this;
        }
        setTwitchAssetsLargeImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.large_image, this)
              : ((this.game.assets.large_image =
                  "twitch:" + e.replace(/twitch\:/g, "")),
                this)
          );
        }
        setTwitchAssetsSmallImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.small_image, this)
              : ((this.game.assets.small_image =
                  "twitch:" + e.replace(/twitch\:/g, "")),
                this)
          );
        }
        setSpotifyAssets(e) {
          this.verifyNull();
          let t = {
            setLargeImage: function (e) {
              return (
                this.verifyNullAssets(),
                (this.game.assets.large_image =
                  "spotify:" + e.replace(/spotify\:/g, "")),
                t
              );
            }.bind(this),
            setSmallImage: function (e) {
              return (
                this.verifyNullAssets(),
                (this.game.assets.small_image =
                  "spotify:" + e.replace(/spotify\:/g, "")),
                t
              );
            }.bind(this),
            setLargeText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.large_text = e), t
              );
            }.bind(this),
            setSmallText: function (e) {
              return (
                this.verifyNullAssets(), (this.game.assets.small_text = e), t
              );
            }.bind(this),
            setNull: function () {
              return (this.game.assets = null), t;
            }.bind(this),
          };
          return e(t), this;
        }
        setSpotifyAssetsLargeImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.large_image, this)
              : ((this.game.assets.large_image =
                  "spotify:" + e.replace(/spotify\:/g, "")),
                this)
          );
        }
        setSpotifyAssetsSmallImage(e) {
          return (
            this.verifyNull(),
            this.verifyNullAssets(),
            null === e
              ? (delete this.game.assets.small_image, this)
              : ((this.game.assets.small_image =
                  "spotify:" + e.replace(/spotify\:/g, "")),
                this)
          );
        }
        verifyNull() {
          this.game || (this.game = { name: "", type: 0 });
        }
        verifyNullAssets() {
          this.game.assets || (this.game.assets = {});
        }
        verifyNullTimestamps() {
          this.game.timestamps || (this.game.timestamps = {});
        }
        verifyNullParty() {
          this.game.party || (this.game.party = { id: "" });
        }
        verifyNullSecrets() {
          this.game.secrets || (this.game.secrets = {});
        }
      }
      var f = {
        Rpc: h,
        PresenceTypes: l,
        PresenceTypesString: o,
        PresenceTypesNumber: a,
        RpcError: c,
        getRpcImages: u,
        getRpcImage: async function (e, t) {
          if ("string" != typeof t || !t)
            throw new c(`'${t}' không phải là String`);
          let s = await u(e),
            r = s.find((e) => e.name === t);
          if (!r)
            throw new c(
              `Image '${t}' không có trong ApplicationID ${e}. Các hình ảnh sẵn có là: ${s
                .map((e) => e.name)
                .join(", ")}.`
            );
          return r;
        },
        __esModule: !0,
        createSpotifyRpc: (e, t) =>
          new h(t)
            .setType(2)
            .setEndTimestamp(Date.now() + 864e5)
            .setSyncId("6l7PqWKsgm4NLomOE7Veou")
            .setSessionId(e.ws.connection.sessionID)
            .setPartyId("spotify:" + e.user.id)
            .setName("Spotify")
            .setId("spotify:1")
            .setFlags(48)
            .setCreatedAt(1561389854174)
            .setSecrets({
              join: "025ed05c71f639de8bfaa0d679d7c94b2fdce12f",
              spectate: "e7eb30d2ee025ed05c71ea495f770b76454ee4e0",
              match: "4b2fdce12f639de8bfa7e3591b71a0d679d7c93f",
            }),
        version: n.version,
        CustomStatus: class {
          constructor(e) {
            (this.game = {
							name: 'Custom Status',
							emoji: null,
							type: 4,
							state: '??',
						}),
							e && (this.game = e);
          }
          setState(e) {
            return (this.game.state = e), this;
          }
          setEmoji(e) {
            let t = {
              setName: function (e) {
                return (
                  this.game.emoji || (this.game.emoji = {}),
                  (this.game.emoji.name = e),
                  t
                );
              }.bind(this),
              setId: function (e) {
                return (
                  this.game.emoji || (this.game.emoji = {}),
                  (this.game.emoji.id = e),
                  t
                );
              }.bind(this),
              setAnimated: function (e) {
                return (
                  this.game.emoji || (this.game.emoji = {}),
                  (this.game.emoji.animated = e),
                  t
                );
              }.bind(this),
            };
            return e(t), this;
          }
          setDiscordEmoji(e) {
            return (
              (this.game.emoji = {
                name: e.name,
                id: e.id,
                animated: e.animated,
              }),
              this
            );
          }
          setUnicodeEmoji(e) {
            return (this.game.emoji = { name: e, id: null, animated: !1 }), this;
          }
          toDiscord() {
            return this.game;
          }
          toObject() {
            return this.game;
          }
          toString() {
            return `${this.game.name}: ${
              this.game.emoji
                ? ((e = this.game.emoji),
                  (null === e.id
                    ? e.name
                    : `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`) + " ")
                : ""
            }${this.game.state}`;
            var e;
          }
        },
      };
      (f.default = f), (e.exports = f);
    },
    function (e, t, s) {
      "use strict";
      function r(e) {
        return e && "object" == typeof e && "default" in e ? e.default : e;
      }
      Object.defineProperty(t, "__esModule", { value: !0 });
      var i = s(2),
        n = r(s(3)),
        o = r(s(4)),
        a = r(s(5)),
        l = r(s(6));
      const u = i.Readable,
        c = Symbol("buffer"),
        h = Symbol("type");
      class f {
        constructor() {
          this[h] = "";
          const e = arguments[0],
            t = arguments[1],
            s = [];
          let r = 0;
          if (e) {
            const t = e,
              i = Number(t.length);
            for (let e = 0; e < i; e++) {
              const i = t[e];
              let n;
              (n =
                i instanceof Buffer
                  ? i
                  : ArrayBuffer.isView(i)
                  ? Buffer.from(i.buffer, i.byteOffset, i.byteLength)
                  : i instanceof ArrayBuffer
                  ? Buffer.from(i)
                  : i instanceof f
                  ? i[c]
                  : Buffer.from("string" == typeof i ? i : String(i))),
                (r += n.length),
                s.push(n);
            }
          }
          this[c] = Buffer.concat(s);
          let i = t && void 0 !== t.type && String(t.type).toLowerCase();
          i && !/[^\u0020-\u007E]/.test(i) && (this[h] = i);
        }
        get size() {
          return this[c].length;
        }
        get type() {
          return this[h];
        }
        text() {
          return Promise.resolve(this[c].toString());
        }
        arrayBuffer() {
          const e = this[c],
            t = e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
          return Promise.resolve(t);
        }
        stream() {
          const e = new u();
          return (e._read = function () {}), e.push(this[c]), e.push(null), e;
        }
        toString() {
          return "[object Blob]";
        }
        slice() {
          const e = this.size,
            t = arguments[0],
            s = arguments[1];
          let r, i;
          (r = void 0 === t ? 0 : t < 0 ? Math.max(e + t, 0) : Math.min(t, e)),
            (i = void 0 === s ? e : s < 0 ? Math.max(e + s, 0) : Math.min(s, e));
          const n = Math.max(i - r, 0),
            o = this[c].slice(r, r + n),
            a = new f([], { type: arguments[2] });
          return (a[c] = o), a;
        }
      }
      function m(e, t, s) {
        Error.call(this, e),
          (this.message = e),
          (this.type = t),
          s && (this.code = this.errno = s.code),
          Error.captureStackTrace(this, this.constructor);
      }
      Object.defineProperties(f.prototype, {
        size: { enumerable: !0 },
        type: { enumerable: !0 },
        slice: { enumerable: !0 },
      }),
        Object.defineProperty(f.prototype, Symbol.toStringTag, {
          value: "Blob",
          writable: !1,
          enumerable: !1,
          configurable: !0,
        }),
        (m.prototype = Object.create(Error.prototype)),
        (m.prototype.constructor = m),
        (m.prototype.name = "FetchError");
      const d = Symbol("Body internals"),
        p = i.PassThrough;
      function g(e) {
        var t = this,
          s = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
          r = s.size;
        let n = void 0 === r ? 0 : r;
        var o = s.timeout;
        let a = void 0 === o ? 0 : o;
        null == e
          ? (e = null)
          : b(e)
          ? (e = Buffer.from(e.toString()))
          : v(e) ||
            Buffer.isBuffer(e) ||
            ("[object ArrayBuffer]" === Object.prototype.toString.call(e)
              ? (e = Buffer.from(e))
              : ArrayBuffer.isView(e)
              ? (e = Buffer.from(e.buffer, e.byteOffset, e.byteLength))
              : e instanceof i || (e = Buffer.from(String(e)))),
          (this[d] = { body: e, disturbed: !1, error: null }),
          (this.size = n),
          (this.timeout = a),
          e instanceof i &&
            e.on("error", function (e) {
              const s =
                "AbortError" === e.name
                  ? e
                  : new m(
                      `Invalid response body while trying to fetch ${t.url}: ${e.message}`,
                      "system",
                      e
                    );
              t[d].error = s;
            });
      }
      function y() {
        var e = this;
        if (this[d].disturbed)
          return g.Promise.reject(
            new TypeError(`body used already for: ${this.url}`)
          );
        if (((this[d].disturbed = !0), this[d].error))
          return g.Promise.reject(this[d].error);
        let t = this.body;
        if (null === t) return g.Promise.resolve(Buffer.alloc(0));
        if ((v(t) && (t = t.stream()), Buffer.isBuffer(t)))
          return g.Promise.resolve(t);
        if (!(t instanceof i)) return g.Promise.resolve(Buffer.alloc(0));
        let s = [],
          r = 0,
          n = !1;
        return new g.Promise(function (i, o) {
          let a;
          e.timeout &&
            (a = setTimeout(function () {
              (n = !0),
                o(
                  new m(
                    `Response timeout while trying to fetch ${e.url} (over ${e.timeout}ms)`,
                    "body-timeout"
                  )
                );
            }, e.timeout)),
            t.on("error", function (t) {
              "AbortError" === t.name
                ? ((n = !0), o(t))
                : o(
                    new m(
                      `Invalid response body while trying to fetch ${e.url}: ${t.message}`,
                      "system",
                      t
                    )
                  );
            }),
            t.on("data", function (t) {
              if (!n && null !== t) {
                if (e.size && r + t.length > e.size)
                  return (
                    (n = !0),
                    void o(
                      new m(
                        `content size at ${e.url} over limit: ${e.size}`,
                        "max-size"
                      )
                    )
                  );
                (r += t.length), s.push(t);
              }
            }),
            t.on("end", function () {
              if (!n) {
                clearTimeout(a);
                try {
                  i(Buffer.concat(s, r));
                } catch (t) {
                  o(
                    new m(
                      `Could not create Buffer from response body for ${e.url}: ${t.message}`,
                      "system",
                      t
                    )
                  );
                }
              }
            });
        });
      }
      function b(e) {
        return (
          "object" == typeof e &&
          "function" == typeof e.append &&
          "function" == typeof e.delete &&
          "function" == typeof e.get &&
          "function" == typeof e.getAll &&
          "function" == typeof e.has &&
          "function" == typeof e.set &&
          ("URLSearchParams" === e.constructor.name ||
            "[object URLSearchParams]" === Object.prototype.toString.call(e) ||
            "function" == typeof e.sort)
        );
      }
      function v(e) {
        return (
          "object" == typeof e &&
          "function" == typeof e.arrayBuffer &&
          "string" == typeof e.type &&
          "function" == typeof e.stream &&
          "function" == typeof e.constructor &&
          "string" == typeof e.constructor.name &&
          /^(Blob|File)$/.test(e.constructor.name) &&
          /^(Blob|File)$/.test(e[Symbol.toStringTag])
        );
      }
      function w(e) {
        let t,
          s,
          r = e.body;
        if (e.bodyUsed) throw new Error("cannot clone body after it is used");
        return (
          r instanceof i &&
            "function" != typeof r.getBoundary &&
            ((t = new p()),
            (s = new p()),
            r.pipe(t),
            r.pipe(s),
            (e[d].body = t),
            (r = s)),
          r
        );
      }
      function S(e) {
        return null === e
          ? null
          : "string" == typeof e
          ? "text/plain;charset=UTF-8"
          : b(e)
          ? "application/x-www-form-urlencoded;charset=UTF-8"
          : v(e)
          ? e.type || null
          : Buffer.isBuffer(e)
          ? null
          : "[object ArrayBuffer]" === Object.prototype.toString.call(e)
          ? null
          : ArrayBuffer.isView(e)
          ? null
          : "function" == typeof e.getBoundary
          ? `multipart/form-data;boundary=${e.getBoundary()}`
          : e instanceof i
          ? null
          : "text/plain;charset=UTF-8";
      }
      function x(e) {
        const t = e.body;
        return null === t
          ? 0
          : v(t)
          ? t.size
          : Buffer.isBuffer(t)
          ? t.length
          : t &&
            "function" == typeof t.getLengthSync &&
            ((t._lengthRetrievers && 0 == t._lengthRetrievers.length) ||
              (t.hasKnownLength && t.hasKnownLength()))
          ? t.getLengthSync()
          : null;
      }
      (g.prototype = {
        get body() {
          return this[d].body;
        },
        get bodyUsed() {
          return this[d].disturbed;
        },
        arrayBuffer() {
          return y.call(this).then(function (e) {
            return e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength);
          });
        },
        blob() {
          let e = (this.headers && this.headers.get("content-type")) || "";
          return y.call(this).then(function (t) {
            return Object.assign(new f([], { type: e.toLowerCase() }), {
              [c]: t,
            });
          });
        },
        json() {
          var e = this;
          return y.call(this).then(function (t) {
            try {
              return JSON.parse(t.toString());
            } catch (t) {
              return g.Promise.reject(
                new m(
                  `invalid json response body at ${e.url} reason: ${t.message}`,
                  "invalid-json"
                )
              );
            }
          });
        },
        text() {
          return y.call(this).then(function (e) {
            return e.toString();
          });
        },
        buffer() {
          return y.call(this);
        },
        textConverted() {
          var e = this;
          return y.call(this).then(function (t) {
            return (function (e, t) {
              throw new Error(
                "The package `encoding` must be installed to use the textConverted() function"
              );
              const s = t.get("content-type");
              let r,
                i,
                n = "utf-8";
              s && (r = /charset=([^;]*)/i.exec(s));
              (i = e.slice(0, 1024).toString()),
                !r && i && (r = /<meta.+?charset=(['"])(.+?)\1/i.exec(i));
              !r &&
                i &&
                ((r =
                  /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(
                    i
                  )),
                r && (r = /charset=(.*)/i.exec(r.pop())));
              !r && i && (r = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(i));
              r &&
                ((n = r.pop()),
                ("gb2312" !== n && "gbk" !== n) || (n = "gb18030"));
              return (void 0)(e, "UTF-8", n).toString();
            })(t, e.headers);
          });
        },
      }),
        Object.defineProperties(g.prototype, {
          body: { enumerable: !0 },
          bodyUsed: { enumerable: !0 },
          arrayBuffer: { enumerable: !0 },
          blob: { enumerable: !0 },
          json: { enumerable: !0 },
          text: { enumerable: !0 },
        }),
        (g.mixIn = function (e) {
          for (const t of Object.getOwnPropertyNames(g.prototype))
            if (!(t in e)) {
              const s = Object.getOwnPropertyDescriptor(g.prototype, t);
              Object.defineProperty(e, t, s);
            }
        }),
        (g.Promise = global.Promise);
      const j = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/,
        T = /[^\t\x20-\x7e\x80-\xff]/;
      function N(e) {
        if (((e = `${e}`), j.test(e) || "" === e))
          throw new TypeError(`${e} is not a legal HTTP header name`);
      }
      function A(e) {
        if (((e = `${e}`), T.test(e)))
          throw new TypeError(`${e} is not a legal HTTP header value`);
      }
      function O(e, t) {
        t = t.toLowerCase();
        for (const s in e) if (s.toLowerCase() === t) return s;
      }
      const _ = Symbol("map");
      class P {
        constructor() {
          let e =
            arguments.length > 0 && void 0 !== arguments[0]
              ? arguments[0]
              : void 0;
          if (((this[_] = Object.create(null)), e instanceof P)) {
            const t = e.raw(),
              s = Object.keys(t);
            for (const e of s) for (const s of t[e]) this.append(e, s);
          } else if (null == e);
          else {
            if ("object" != typeof e)
              throw new TypeError("Provided initializer must be an object");
            {
              const t = e[Symbol.iterator];
              if (null != t) {
                if ("function" != typeof t)
                  throw new TypeError("Header pairs must be iterable");
                const s = [];
                for (const t of e) {
                  if (
                    "object" != typeof t ||
                    "function" != typeof t[Symbol.iterator]
                  )
                    throw new TypeError("Each header pair must be iterable");
                  s.push(Array.from(t));
                }
                for (const e of s) {
                  if (2 !== e.length)
                    throw new TypeError(
                      "Each header pair must be a name/value tuple"
                    );
                  this.append(e[0], e[1]);
                }
              } else
                for (const t of Object.keys(e)) {
                  const s = e[t];
                  this.append(t, s);
                }
            }
          }
        }
        get(e) {
          N((e = `${e}`));
          const t = O(this[_], e);
          return void 0 === t ? null : this[_][t].join(", ");
        }
        forEach(e) {
          let t =
              arguments.length > 1 && void 0 !== arguments[1]
                ? arguments[1]
                : void 0,
            s = E(this),
            r = 0;
          for (; r < s.length; ) {
            var i = s[r];
            const n = i[0],
              o = i[1];
            e.call(t, o, n, this), (s = E(this)), r++;
          }
        }
        set(e, t) {
          (t = `${t}`), N((e = `${e}`)), A(t);
          const s = O(this[_], e);
          this[_][void 0 !== s ? s : e] = [t];
        }
        append(e, t) {
          (t = `${t}`), N((e = `${e}`)), A(t);
          const s = O(this[_], e);
          void 0 !== s ? this[_][s].push(t) : (this[_][e] = [t]);
        }
        has(e) {
          return N((e = `${e}`)), void 0 !== O(this[_], e);
        }
        delete(e) {
          N((e = `${e}`));
          const t = O(this[_], e);
          void 0 !== t && delete this[_][t];
        }
        raw() {
          return this[_];
        }
        keys() {
          return $(this, "key");
        }
        values() {
          return $(this, "value");
        }
        [Symbol.iterator]() {
          return $(this, "key+value");
        }
      }
      function E(e) {
        let t =
          arguments.length > 1 && void 0 !== arguments[1]
            ? arguments[1]
            : "key+value";
        const s = Object.keys(e[_]).sort();
        return s.map(
          "key" === t
            ? function (e) {
                return e.toLowerCase();
              }
            : "value" === t
            ? function (t) {
                return e[_][t].join(", ");
              }
            : function (t) {
                return [t.toLowerCase(), e[_][t].join(", ")];
              }
        );
      }
      (P.prototype.entries = P.prototype[Symbol.iterator]),
        Object.defineProperty(P.prototype, Symbol.toStringTag, {
          value: "Headers",
          writable: !1,
          enumerable: !1,
          configurable: !0,
        }),
        Object.defineProperties(P.prototype, {
          get: { enumerable: !0 },
          forEach: { enumerable: !0 },
          set: { enumerable: !0 },
          append: { enumerable: !0 },
          has: { enumerable: !0 },
          delete: { enumerable: !0 },
          keys: { enumerable: !0 },
          values: { enumerable: !0 },
          entries: { enumerable: !0 },
        });
      const L = Symbol("internal");
      function $(e, t) {
        const s = Object.create(k);
        return (s[L] = { target: e, kind: t, index: 0 }), s;
      }
      const k = Object.setPrototypeOf(
        {
          next() {
            if (!this || Object.getPrototypeOf(this) !== k)
              throw new TypeError("Value of `this` is not a HeadersIterator");
            var e = this[L];
            const t = e.target,
              s = e.kind,
              r = e.index,
              i = E(t, s);
            return r >= i.length
              ? { value: void 0, done: !0 }
              : ((this[L].index = r + 1), { value: i[r], done: !1 });
          },
        },
        Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()))
      );
      function I(e) {
        const t = Object.assign({ __proto__: null }, e[_]),
          s = O(e[_], "Host");
        return void 0 !== s && (t[s] = t[s][0]), t;
      }
      Object.defineProperty(k, Symbol.toStringTag, {
        value: "HeadersIterator",
        writable: !1,
        enumerable: !1,
        configurable: !0,
      });
      const B = Symbol("Response internals"),
        C = n.STATUS_CODES;
      class R {
        constructor() {
          let e =
              arguments.length > 0 && void 0 !== arguments[0]
                ? arguments[0]
                : null,
            t =
              arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
          g.call(this, e, t);
          const s = t.status || 200,
            r = new P(t.headers);
          if (null != e && !r.has("Content-Type")) {
            const t = S(e);
            t && r.append("Content-Type", t);
          }
          this[B] = {
            url: t.url,
            status: s,
            statusText: t.statusText || C[s],
            headers: r,
            counter: t.counter,
          };
        }
        get url() {
          return this[B].url || "";
        }
        get status() {
          return this[B].status;
        }
        get ok() {
          return this[B].status >= 200 && this[B].status < 300;
        }
        get redirected() {
          return this[B].counter > 0;
        }
        get statusText() {
          return this[B].statusText;
        }
        get headers() {
          return this[B].headers;
        }
        clone() {
          return new R(w(this), {
            url: this.url,
            status: this.status,
            statusText: this.statusText,
            headers: this.headers,
            ok: this.ok,
            redirected: this.redirected,
          });
        }
      }
      g.mixIn(R.prototype),
        Object.defineProperties(R.prototype, {
          url: { enumerable: !0 },
          status: { enumerable: !0 },
          ok: { enumerable: !0 },
          redirected: { enumerable: !0 },
          statusText: { enumerable: !0 },
          headers: { enumerable: !0 },
          clone: { enumerable: !0 },
        }),
        Object.defineProperty(R.prototype, Symbol.toStringTag, {
          value: "Response",
          writable: !1,
          enumerable: !1,
          configurable: !0,
        });
      const z = Symbol("Request internals"),
        U = o.parse,
        q = o.format,
        F = "destroy" in i.Readable.prototype;
      function D(e) {
        return "object" == typeof e && "object" == typeof e[z];
      }
      class M {
        constructor(e) {
          let t,
            s =
              arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
          D(e)
            ? (t = U(e.url))
            : ((t = e && e.href ? U(e.href) : U(`${e}`)), (e = {}));
          let r = s.method || e.method || "GET";
          if (
            ((r = r.toUpperCase()),
            (null != s.body || (D(e) && null !== e.body)) &&
              ("GET" === r || "HEAD" === r))
          )
            throw new TypeError("Request with GET/HEAD method cannot have body");
          let i = null != s.body ? s.body : D(e) && null !== e.body ? w(e) : null;
          g.call(this, i, {
            timeout: s.timeout || e.timeout || 0,
            size: s.size || e.size || 0,
          });
          const n = new P(s.headers || e.headers || {});
          if (null != i && !n.has("Content-Type")) {
            const e = S(i);
            e && n.append("Content-Type", e);
          }
          let o = D(e) ? e.signal : null;
          if (
            ("signal" in s && (o = s.signal),
            null != o &&
              !(function (e) {
                const t = e && "object" == typeof e && Object.getPrototypeOf(e);
                return !(!t || "AbortSignal" !== t.constructor.name);
              })(o))
          )
            throw new TypeError(
              "Expected signal to be an instanceof AbortSignal"
            );
          (this[z] = {
            method: r,
            redirect: s.redirect || e.redirect || "follow",
            headers: n,
            parsedURL: t,
            signal: o,
          }),
            (this.follow =
              void 0 !== s.follow
                ? s.follow
                : void 0 !== e.follow
                ? e.follow
                : 20),
            (this.compress =
              void 0 !== s.compress
                ? s.compress
                : void 0 === e.compress || e.compress),
            (this.counter = s.counter || e.counter || 0),
            (this.agent = s.agent || e.agent);
        }
        get method() {
          return this[z].method;
        }
        get url() {
          return q(this[z].parsedURL);
        }
        get headers() {
          return this[z].headers;
        }
        get redirect() {
          return this[z].redirect;
        }
        get signal() {
          return this[z].signal;
        }
        clone() {
          return new M(this);
        }
      }
      function H(e) {
        Error.call(this, e),
          (this.type = "aborted"),
          (this.message = e),
          Error.captureStackTrace(this, this.constructor);
      }
      g.mixIn(M.prototype),
        Object.defineProperty(M.prototype, Symbol.toStringTag, {
          value: "Request",
          writable: !1,
          enumerable: !1,
          configurable: !0,
        }),
        Object.defineProperties(M.prototype, {
          method: { enumerable: !0 },
          url: { enumerable: !0 },
          headers: { enumerable: !0 },
          redirect: { enumerable: !0 },
          clone: { enumerable: !0 },
          signal: { enumerable: !0 },
        }),
        (H.prototype = Object.create(Error.prototype)),
        (H.prototype.constructor = H),
        (H.prototype.name = "AbortError");
      const G = i.PassThrough,
        V = o.resolve;
      function W(e, t) {
        if (!W.Promise)
          throw new Error(
            "native promise missing, set fetch.Promise to your favorite alternative"
          );
        return (
          (g.Promise = W.Promise),
          new W.Promise(function (r, o) {
            const c = new M(e, t);
            if ("data:" == c[z].parsedURL.protocol) {
              if ("get" !== c.method.toLowerCase())
                return o(
                  new m("Cannot access " + e + " with another method than get.")
                );
              let t = q(c[z].parsedURL);
              if (((t = t.slice(5)), !t)) return o(new m("Invalid data url"));
              let s,
                i,
                [n, a] = t.split(",");
              if (n) {
                let [e, t] = n.split(";");
                (i = e || "text/plain"), (s = t || "ascii");
              } else (s = "ascii"), (i = "text/plain");
              let l = new u({}),
                h = new P();
              h.set("Content-Type", i + ";charset=ascii");
              const f = {
                url: c.url,
                status: 200,
                statusText: "",
                headers: h,
                size: 0,
                timeout: c.timeout,
                counter: c.counter,
              };
              let d = new R(l, f);
              return l.push(a, s), l.push(null), r(d);
            }
            if ("file:" == c[z].parsedURL.protocol) {
              let t = ["get", "delete", "post"];
              if (!t.includes(c.method.toLowerCase()))
                return o(
                  new m(
                    "Cannot access " +
                      e +
                      " with another method than " +
                      t.join(", ") +
                      "."
                  )
                );
              let i = q(c[z].parsedURL);
              if (
                ((i = i.slice(5)),
                !(
                  "win32" == process.platform
                    ? /file:\/\/\/[A-Z]:\/(([\w ]+\/?(\.[\w ]+)?)+)?/
                    : /file:\/\/\/((\w+\/?(\.\w+)?)+)?/
                ).test(q(c[z].parsedURL)))
              )
                return o(new m("INVALID URL"));
              i = i.slice(3);
              let n = s(7);
              return n.exists(
                i,
                (e) => (
                  console.log(e),
                  e
                    ? n.stat(i, (e, t) => {
                        if (e) return o(e);
                        if (t.isDirectory())
                          n.readdir(
                            i,
                            { encoding: "utf-8", withFileTypes: !0 },
                            (e, t) => {
                              if (e) return o(new m(e.message || e));
                              let s = new P(),
                                i = new u({}),
                                n = JSON.stringify(
                                  t.map((e) => ({
                                    name: e.name,
                                    isDirectory: e.isDirectory(),
                                    isFile: e.isFile(),
                                  }))
                                );
                              s.set("type", "folder");
                              const a = {
                                url: c.url,
                                status: 200,
                                statusText: "FOLDER",
                                headers: s,
                                timeout: c.timeout,
                                counter: c.counter,
                              };
                              let l = new R(i, a);
                              return i.push(n), i.push(null), r(l);
                            }
                          );
                        else if (t.isFile()) {
                          let e = n.createReadStream(i, { encoding: "utf-8" });
                          e.on("error", function (e) {
                            o(
                              new m(
                                `request to ${c.url} failed, reason: ${e.message}`,
                                "system",
                                e
                              )
                            );
                          });
                          let t = new P();
                          t.set("type", "file");
                          let l = s(8).basename(i).split("."),
                            u = "";
                          function a(e) {
                            u = e;
                          }
                          if (l[1]) {
                            let e = l[l.length - 1].toLowerCase();
                            if (["gif", "jpeg", "jpg", "png", "tiff"].includes(e))
                              a("image/" + e);
                            else
                              switch (e) {
                                case "tif":
                                  a("image/tiff");
                                  break;
                                case "apng":
                                  a("image/png");
                                  break;
                                case "ico":
                                  a("image/x-icon");
                                  break;
                                case "svg":
                                case "svgz":
                                  a("image/svg+xml");
                                  break;
                                case "css":
                                  a("text/css");
                                case "csv":
                                  a("text/csv");
                                  break;
                                case "html":
                                  a("text/html");
                                  break;
                                case "js":
                                  a("application/javascript");
                                  break;
                                case "xml":
                                  a("text/xml");
                                  break;
                                case "mpg":
                                case "mpeg":
                                case "mp1":
                                case "mp2":
                                case "mp3":
                                case "m1v":
                                case "mpv":
                                case "m1a":
                                case "m2a":
                                case "mpa":
                                  a(
                                    (["mpe", "mpeg", "mpg"].includes(e)
                                      ? "video"
                                      : "audio") + "/mpeg"
                                  );
                                  break;
                                case "mp4":
                                case "m4a":
                                case "m4p":
                                case "m4b":
                                case "m4r":
                                case "m4v":
                                  let t = "audio";
                                  "mp4" == e && (t = "video"), a(t + "/mp4");
                                  break;
                                case "mov":
                                  a("video/quicktime");
                                  break;
                                case "wmv":
                                case "wm":
                                  a("video/x-ms-wmv");
                                  break;
                                case "avi":
                                  a("video/x-msvideo");
                                  break;
                                case "flv":
                                  a("video/x-flv");
                                  break;
                                case "json":
                                  a("application/json");
                                  break;
                                case "zip":
                                  a("application/zip");
                                  break;
                                case "jsonld":
                                  a("application/ld+json");
                                  break;
                                case "ogg":
                                case "ogv":
                                case "oga":
                                case "ogx":
                                case "spx":
                                case "opus":
                                case "ogm":
                                  a("application/ogg");
                                  break;
                                case "pdf":
                                  a("application/pdf");
                                  break;
                                case "xhtml":
                                case "xht":
                                case "htm":
                                  a("application/xhtml+xml");
                                  break;
                                case "wav":
                                  a("audio/wav");
                                  break;
                                default:
                                  a("text/plain");
                              }
                          } else u = "text/plain";
                          (u += ";charset=utf-8"), t.set("content-type", u);
                          let h = e.pipe(G());
                          const f = {
                            url: c.url,
                            status: 200,
                            statusText: "FILE",
                            headers: t,
                            timeout: c.timeout,
                            counter: c.counter,
                          };
                          let d = new R(h, f);
                          return r(d);
                        }
                      })
                    : (function () {
                        let e = new P(),
                          t = new u({});
                        const s = {
                          url: c.url,
                          status: 404,
                          statusText: "ERR_FILE_NOT_FOUND",
                          headers: e,
                          size: 0,
                          timeout: c.timeout,
                          counter: c.counter,
                        };
                        let i = new R(t, s);
                        return t.push(null), r(i);
                      })()
                )
              );
            }
            const h = (function (e) {
                const t = e[z].parsedURL,
                  s = new P(e[z].headers);
                if (
                  (s.has("Accept") || s.set("Accept", "*/*"),
                  !t.protocol || !t.hostname)
                )
                  throw new TypeError("Only absolute URLs are supported");
                if (!/^https?:$/.test(t.protocol))
                  throw new TypeError("Only HTTP(S) protocols are supported");
                if (e.signal && e.body instanceof i.Readable && !F)
                  throw new Error(
                    "Cancellation of streamed requests with AbortSignal is not supported in node < 8"
                  );
                let r = null;
                if (
                  (null == e.body && /^(POST|PUT)$/i.test(e.method) && (r = "0"),
                  null != e.body)
                ) {
                  const t = x(e);
                  "number" == typeof t && (r = String(t));
                }
                r && s.set("Content-Length", r),
                  s.has("User-Agent") ||
                    s.set(
                      "User-Agent",
                      "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"
                    ),
                  e.compress &&
                    !s.has("Accept-Encoding") &&
                    s.set("Accept-Encoding", "gzip,deflate");
                let n = e.agent;
                return (
                  "function" == typeof n && (n = n(t)),
                  s.has("Connection") || n || s.set("Connection", "close"),
                  Object.assign({}, t, {
                    method: e.method,
                    headers: I(s),
                    agent: n,
                  })
                );
              })(c),
              f = ("https:" === h.protocol ? a : n).request,
              d = c.signal;
            let p = null;
            const g = function () {
              let e = new H("The user aborted a request.");
              o(e),
                c.body && c.body instanceof i.Readable && c.body.destroy(e),
                p && p.body && p.body.emit("error", e);
            };
            if (d && d.aborted) return void g();
            const y = function () {
                g(), S();
              },
              b = f(h);
            let w;
            function S() {
              b.abort(), d && d.removeEventListener("abort", y), clearTimeout(w);
            }
            d && d.addEventListener("abort", y),
              c.timeout &&
                b.once("socket", function (e) {
                  w = setTimeout(function () {
                    o(new m(`network timeout at: ${c.url}`, "request-timeout")),
                      S();
                  }, c.timeout);
                }),
              b.on("error", function (e) {
                o(
                  new m(
                    `request to ${c.url} failed, reason: ${e.message}`,
                    "system",
                    e
                  )
                ),
                  S();
              }),
              b.on("response", function (e) {
                clearTimeout(w);
                const t = (function (e) {
                  const t = new P();
                  for (const s of Object.keys(e))
                    if (!j.test(s))
                      if (Array.isArray(e[s]))
                        for (const r of e[s])
                          T.test(r) ||
                            (void 0 === t[_][s]
                              ? (t[_][s] = [r])
                              : t[_][s].push(r));
                      else T.test(e[s]) || (t[_][s] = [e[s]]);
                  return t;
                })(e.headers);
                if (W.isRedirect(e.statusCode)) {
                  const s = t.get("Location"),
                    i = null === s ? null : V(c.url, s);
                  switch (c.redirect) {
                    case "error":
                      return (
                        o(
                          new m(
                            `redirect mode is set to error: ${c.url}`,
                            "no-redirect"
                          )
                        ),
                        void S()
                      );
                    case "manual":
                      if (null !== i)
                        try {
                          t.set("Location", i);
                        } catch (e) {
                          o(e);
                        }
                      break;
                    case "follow":
                      if (null === i) break;
                      if (c.counter >= c.follow)
                        return (
                          o(
                            new m(
                              `maximum redirect reached at: ${c.url}`,
                              "max-redirect"
                            )
                          ),
                          void S()
                        );
                      const s = {
                        headers: new P(c.headers),
                        follow: c.follow,
                        counter: c.counter + 1,
                        agent: c.agent,
                        compress: c.compress,
                        method: c.method,
                        body: c.body,
                        signal: c.signal,
                        timeout: c.timeout,
                      };
                      return 303 !== e.statusCode && c.body && null === x(c)
                        ? (o(
                            new m(
                              "Cannot follow redirect with body being a readable stream",
                              "unsupported-redirect"
                            )
                          ),
                          void S())
                        : ((303 !== e.statusCode &&
                            ((301 !== e.statusCode && 302 !== e.statusCode) ||
                              "POST" !== c.method)) ||
                            ((s.method = "GET"),
                            (s.body = void 0),
                            s.headers.delete("content-length")),
                          r(W(new M(i, s))),
                          void S());
                  }
                }
                e.once("end", function () {
                  d && d.removeEventListener("abort", y);
                });
                let s = e.pipe(new G());
                const i = {
                    url: c.url,
                    status: e.statusCode,
                    statusText: e.statusMessage,
                    headers: t,
                    size: c.size,
                    timeout: c.timeout,
                    counter: c.counter,
                  },
                  n = t.get("Content-Encoding");
                if (
                  !c.compress ||
                  "HEAD" === c.method ||
                  null === n ||
                  204 === e.statusCode ||
                  304 === e.statusCode
                )
                  return (p = new R(s, i)), void r(p);
                const a = { flush: l.Z_SYNC_FLUSH, finishFlush: l.Z_SYNC_FLUSH };
                if ("gzip" == n || "x-gzip" == n)
                  return (
                    (s = s.pipe(l.createGunzip(a))), (p = new R(s, i)), void r(p)
                  );
                if ("deflate" != n && "x-deflate" != n) {
                  if ("br" == n && "function" == typeof l.createBrotliDecompress)
                    return (
                      (s = s.pipe(l.createBrotliDecompress())),
                      (p = new R(s, i)),
                      void r(p)
                    );
                  (p = new R(s, i)), r(p);
                } else {
                  e.pipe(new G()).once("data", function (e) {
                    (s =
                      8 == (15 & e[0])
                        ? s.pipe(l.createInflate())
                        : s.pipe(l.createInflateRaw())),
                      (p = new R(s, i)),
                      r(p);
                  });
                }
              }),
              (function (e, t) {
                const s = t.body;
                null === s
                  ? e.end()
                  : v(s)
                  ? s.stream().pipe(e)
                  : Buffer.isBuffer(s)
                  ? (e.write(s), e.end())
                  : s.pipe(e);
              })(b, c);
          })
        );
      }
      (W.isRedirect = function (e) {
        return 301 === e || 302 === e || 303 === e || 307 === e || 308 === e;
      }),
        (W.Promise = global.Promise),
        (e.exports = t = W),
        Object.defineProperty(t, "__esModule", { value: !0 }),
        (t.default = t),
        (t.Headers = P),
        (t.Request = M),
        (t.Response = R),
        (t.FetchError = m);
    },
    function (e, t) {
      e.exports = require("stream");
    },
    function (e, t) {
      e.exports = require("http");
    },
    function (e, t) {
      e.exports = require("url");
    },
    function (e, t) {
      e.exports = require("https");
    },
    function (e, t) {
      e.exports = require("zlib");
    },
    function (e, t) {
      e.exports = require("fs");
    },
    function (e, t) {
      e.exports = require("path");
    },
    function (e, t, s) {
      "use strict";
      Object.defineProperty(t, "__esModule", { value: !0 }),
        (t.default = {
          discord() {
            let e = "https://discord.com/api/v9";
            return {
              toString: () => e,
              users(t) {
                let s = e + "/users/" + t;
                return { toString: () => s, guilds: () => s + "/guilds" };
              },
              application(t) {
                let s = e + "/oauth2/applications/" + t;
                return { toString: () => s, assets: () => s + "/assets" };
              },
            };
          },
          ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.305 Chrome/69.0.3497.128 Electron/4.0.8 Safari/537.36",
          acceptedLangs: "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        });
    },
    function (e, t) {
      e.exports = require("../package.json");
    },
  ]);
  