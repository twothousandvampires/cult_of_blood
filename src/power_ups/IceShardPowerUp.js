import PowerUp from "./PowerUp.js";
import IceShardSpell from "../spells/IceShardSpell.js";

export default class IceShardPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'ice_shard_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player, io){
        player.newSpell(new IceShardSpell())
        io.sockets.to(player.socket_id).emit('update_spell', player.spell)
    }
}