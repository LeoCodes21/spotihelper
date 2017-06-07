import * as spotify from './index';

let helper = new spotify.SpotifyWebHelper;

helper.player.on('track-will-change', (track) => {
    console.log(`Now playing: '${track.track_resource.name}' by ${track.artist_resource.name} [${track.track_resource.uri}]`);
});

helper.player.on('ready', async () => {
  await helper.player.play('spotify:track:1JY6B9ILvmRla2IKKRZvnH');
  await helper.player.pause(false);

  setTimeout(async () => await helper.player.seek(120), 2500);
});