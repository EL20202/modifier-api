ig.module("game.feature.combat.model.modifier-apply").requires(
  "game.feature.combat.model.combat-params").defines(function() {
  var b = Vec2.create(),
    a = Vec2.create(),
    d = Vec3.create(),
    c = Vec3.create(),
    e = {},
    f = {
      damageResult: void 0,
      attackType: void 0,
      flyLevel: void 0,
      hitStable: void 0,
      damageFactor: void 0,
      weakness: false,
      alignFace: false,
      ignoreHit: false
    };
  var aConst = 0.25,
    dConst = 1.5,
    cConst = 3;
  var funcs = {
    LINEAR: function(a, b) {
      return a * 2 - b
    },
    PERCENTAGE: function(a, b) {
      return a > b ? a * (1 + Math.pow(1 - b / a, 0.5) * 0.2) : a * Math.pow(a / b, 1.5)
    }
  };
  sc.DAMAGE_MODIFIER_FUNCS = {};
  sc.CombatParams.inject({
    init: function(a) {
      if (a)
        for (var b in this.baseParams) this.baseParams[b] = a[b] || this.baseParams[b];
      this.currentHp = this.getStat("hp");
      for (b = 0; b < sc.COMBAT_STATUS.length; ++b) sc.COMBAT_STATUS[b] && (this.statusStates[b] = new sc.COMBAT_STATUS[b]);
    },
    getDamage: function(attackInfo, g, h, i, j) {
      let callbacks = [], modFunc, modResult, p = 1;
      let dmgFactor = attackInfo.damageFactor;
      if (!ig.perf.skipDmgModifiers) {
        for (modFunc in sc.DAMAGE_MODIFIER_FUNCS) {
          modResult = sc.DAMAGE_MODIFIER_FUNCS[modFunc](attackInfo, dmgFactor, h.getCombatantRoot(), i, j, this);
          attackInfo = modResult.attackInfo;
          dmgFactor = modResult.damageFactor;
          modResult.applyDamageCallback && callbacks.push(modResult.applyDamageCallback);
        }

        attackInfo.element && (p = this.getStat("elemFactor")[attackInfo.element - 1] * this.tmpElemFactor[attackInfo.element - 1]);
      }

      /*
      * this is a "cheaty" method for the game can calculate damage propery using the modified damage factor
      * the reason that the old damage factor must be retained is that
      * for repeating attack forces, it can have an expoential increase (or decrease)
      * in attack power as the attack goes on
      */
      let oldDmgFactor = attackInfo.damageFactor;
      attackInfo.damageFactor = dmgFactor;
      let damageValue = this.parent(attackInfo, g, h, i, j);
      attackInfo.damageFactor = oldDmgFactor;

      let r = attackInfo.attackerParams.getStat("focus", attackInfo.noHack || false) / this.getStat("focus", attackInfo.noHack || false);
      let idx, m = 0, v;
      if (attackInfo.statusInflict && g > 0 && !j)
        idx = attackInfo.element - 1,
          m = dmgFactor * attackInfo.statusInflict;
      v = (Math.pow(1 + (r >= 1 ? r - 1 : 1 - r) * cConst, aConst) - 1) * dConst;
      r = r >= 1 ? 1 + v : Math.max(0, 1 - v);
      if (idx >= 0) {
        m = m * r * this.getStat("statusInflict")[idx] * this.tmpStatusInflict[idx] * p;
        m = this.statusStates[idx].getInflictValue(m, this, attackInfo, i);
      } else if (this.statusStates[4].id != -1) {
        m = m * r * p;
        m = this.statusStates[4].getInflictValue(m, this, attackInfo, i);
      }

      damageValue.callbacks = callbacks;
      damageValue.status = m;

      return damageValue;
    },
    applyDamage: function(a, b, c) {
      var d = c.getCombatantRoot(),
        c = c.combo || d.combo,
        idx;
      if (c.damageCeiling) {
        d = this.combatant.id;
        c.damageCeiling.sum[d] || (c.damageCeiling.sum[d] = 0);
        c.damageCeiling.sum[d] = c.damageCeiling.sum[d] + a.baseOffensiveFactor
      }
      var idx = !!b.element ? b.element - 1 : 4;
      a.status && this.statusStates[idx] && this.statusStates[idx].inflict(a.status, this, b);
      if (a.callbacks) {
        a.callbacks.forEach(a => a());
      }
      this.reduceHp(a.damage)
    }
  });
});
