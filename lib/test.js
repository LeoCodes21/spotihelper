"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const spotify = require("./index");
let helper = new spotify.SpotifyWebHelper;
helper.player.on('track-will-change', (track) => {
    console.log(`Now playing: '${track.track_resource.name}' by ${track.artist_resource.name} [${track.track_resource.uri}]`);
});
helper.player.on('ready', () => __awaiter(this, void 0, void 0, function* () {
    yield helper.player.play('spotify:track:1JY6B9ILvmRla2IKKRZvnH');
    yield helper.player.pause(false);
    setTimeout(() => __awaiter(this, void 0, void 0, function* () { return yield helper.player.seek(120); }), 2500);
}));
