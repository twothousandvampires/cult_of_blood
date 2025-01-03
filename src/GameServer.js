import PowerUpCreator from "./creators/PowerUpCreator.js";
import Functions from "./Functions.js";
import Garden from "./maps/Garden.js";
import Player from "./player.js";
export default class GameServer{
    MAX_PLAYERS = 10;
    constructor(io) {
        this.io = io
        this.players_count = 0
        this.players = {}
        this.arrows = []
        this.spells = []
        this.power_ups = []
        this.map = new Garden()
        this.beast_is_spawned = false
    }
    beastDead(){
        this.beast_is_spawned = false
        let back_players = Object.values(this.players)
        back_players.forEach(elem => {
            elem.blessed = false
        })
    }
    clearPowerUps(){
        this.power_ups.forEach(elem => {
            this.io.sockets.emit('delete_sprite', elem.id);
        })
        this.power_ups = []
    }
    getRoleForNewPlayer(){
        return this.players_count >= this.MAX_PLAYERS ? 'spec' : 'player'
    }
    createBloodOfferingPowerUp(player){
        if(this.beast_is_spawned) return

        let power_up = PowerUpCreator.create('blood_offering', this)
        if(!power_up) return

        power_up.setCords(player.x, player.y)

        this.power_ups.push(power_up)

        this.io.sockets.emit('update_power_ups', this.power_ups)
    }
    addNewPlayer(nick, skin, socket_id, weapon){
        let player = new Player(socket_id, nick, skin, weapon)
        player.calcPosition(this.map, this.players)
        this.players[socket_id] = player
        return player
    }
    removePlayer(socket_id){
        this.players_count--
        let player = this.getPlayer(socket_id)
        if(!player) return

        if(player.is_beast){
            this.beastDead()
        }

        delete this.players[socket_id]
    }
    init(){
        this.io.on('connection', (socket) => {
            socket.on('get_role', () => {
                let role = this.getRoleForNewPlayer()
                socket.emit('set_role', role, socket.id)
            })

            socket.on('init', (nick, skin, weapon)=>{
                let player = this.addNewPlayer(nick, skin, socket.id, weapon)
                this.io.sockets.emit('update_leaderboard', this.players)
                this.io.sockets.emit('update_log', nick + ' joined to the game')
                socket.emit('update_map', this.map)
                socket.emit('update_power_ups', this.power_ups)
                socket.emit('set_weapon_mode', player.weapon)
            })

            socket.on('hand_attack', () => {
                let player = this.getPlayer(socket.id)
                if(player){
                    player.handAttack(this)
                }
            })

            socket.on('hit_player', (socket_id) => {
                let player_to_hit = this.getPlayer(socket_id)
                let player = this.getPlayer(socket.id)
                if(player && player_to_hit){
                    player_to_hit.weaponHit(this, player)
                }
            })

            socket.on('change_game_state', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.changeGameState(socket)
            })

            socket.on("disconnect", () => {
                this.removePlayer(socket.id)
                this.io.sockets.emit('delete_sprite', socket.id);
                this.io.sockets.emit('update_leaderboard', this.players)
            });

            socket.on('start_attack', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.is_attack = true
                if(player.is_invisible){
                    player.is_invisible = false
                    player.movement_speed += 0.02
                }
            })

            socket.on('start_special', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.startSpecial()
            })

            socket.on('end_special', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.endSpecial(this)
            })

            socket.on('special_cast', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.specialCast(this)
            })

            socket.on('end_attack', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.is_attack = false
            })

            socket.on('revive', () => {
                let player = this.getPlayer(socket.id)
                if (!player) return

                player.revive(this.map, this.players)
            })

            socket.on('inputs', (d) => {
                const player = this.getPlayer(socket.id)

                if (!player) return
                if(player.isDead()) return

                player.update(d, this)
            });

            socket.on('arrow_shot', () => {
                const player = this.getPlayer(socket.id)

                if(!player) return
                player.e(this)
            })

            socket.on('cast', () => {

                const player = this.getPlayer(socket.id)

                if (!player) return

                player.cast(this)
            })

        })
    }
    generatePowerUp(){
        if(this.power_ups.length < this.map.power_up_spots.length){
            if(this.stop_to_create_power_up){
                this.stop_to_create_power_up = false
                return;
            }
            let spot = this.map.getPossiblePowerUpSpot(this.power_ups)

            let power_up = !this.beast_is_spawned ? PowerUpCreator.createRandom(this) : PowerUpCreator.create('bless_pu')
            if(!power_up || !spot) return

            power_up.setCords(spot.x, spot.y)

            this.power_ups.push(power_up)

            this.io.sockets.emit('update_power_ups', this.power_ups)
        }
        else {
            this.stop_to_create_power_up = true
        }
    }
    start(){
        setInterval(()=>{
            this.generatePowerUp()
            let back_players = Object.values(this.players)
            back_players.forEach(player => {
                player.energyRegen(this)
            })
        }, 3000)

        this.gameLoop =  setInterval(() => {
            this.frame()
            this.io.emit('updatePlayers', this.players)
            this.io.emit('updateArrows', this.arrows)
            this.io.emit('updateSpells', this.spells)
        }, 30)
    }
    getPlayer(socket_id){
        return this.players[socket_id]
    }
    createModal(socket_id, color, text){
        this.io.to(socket_id).emit('modal', {
            color: color,
            value: text
        } )
    }
    frame(){
        let back_players = Object.values(this.players)

        for(let i = 0; i < this.arrows.length; i++){
            let arrow = this.arrows[i]
            let layout = this.map.getLayout()
            if(this.map.unmoveble.includes(layout[Math.floor(arrow.y)][Math.floor(arrow.x)])){
                this.arrows = this.arrows.filter(elem => elem !== arrow)
                this.io.sockets.emit('delete_sprite', arrow.id);
            }

            for(let i = 0; i < back_players.length; i++){
                let b_player = back_players[i]

                if(b_player.socket_id ===  arrow.owner_id) continue

                if(b_player.isDead()) continue

                let hit = Math.sqrt(Math.pow(arrow.x- b_player.x, 2) + Math.pow( arrow.y - b_player.y, 2)) < Player.RADIUS
                if(hit && !b_player.isInvulnerable()) {
                    this.io.sockets.emit('delete_sprite', arrow.id);
                    let player = this.getPlayer(arrow.owner_id)
                    b_player.spellHit(this, player, Math.round(18 + Math.random() * (30 - 18)) + player.power, arrow.angle)
                    this.arrows = this.arrows.filter(elem => elem !== arrow)
                }
            }
            arrow.x += Math.cos(Functions.degreeToRadians(arrow.angle)) * 0.25
            arrow.y += Math.sin(Functions.degreeToRadians(arrow.angle)) * 0.25
        }
        for(let i = 0; i < this.power_ups.length; i++){
            let power_up = this.power_ups[i]

            for(let i = 0; i < back_players.length; i++){

                let b_player = back_players[i]

                if(b_player.isDead()) continue

                let hit = Math.sqrt(Math.pow(power_up.x - b_player.x, 2) + Math.pow( power_up.y - b_player.y, 2)) < 0.3
                if(hit){
                    power_up.pickUp(b_player, this.io, this)
                    this.power_ups = this.power_ups.filter(elem => elem !== power_up)
                    this.io.sockets.emit('delete_sprite', power_up.id);
                }
            }
        }

        for(let i = 0; i < this.spells.length; i++){
            let spell = this.spells[i]
            spell.act(this)
        }
    }
}