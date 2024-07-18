async function generatePlaylist() {
    const mood = document.getElementById('mood').value;
    const playlistDiv = document.getElementById('playlist');
    playlistDiv.innerHTML = 'Generating playlist...';

    // Replace with your Spotify client ID and secret
    const clientId = '1008dc2ab8e5414796ea75fe9108dc41';
    const clientSecret = 'c874c5d660e24cd68c32c822cc6c3d78';

    try {
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const response = await fetch(`https://api.spotify.com/v1/recommendations?seed_genres=${mood}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        });

        const data = await response.json();
        const tracks = data.tracks;

        playlistDiv.innerHTML = '<h2>Playlist:</h2>';
        tracks.forEach(track => {
            const trackElement = document.createElement('p');
            trackElement.textContent = track.name + ' by ' + track.artists.map(artist => artist.name).join(', ');
            playlistDiv.appendChild(trackElement);
        });

    } catch (error) {
        console.error('Error generating playlist:', error);
        playlistDiv.innerHTML = 'Failed to generate playlist. Please try again later.';
    }
}
