# TCDisrupt2016

## Set up

```sh
brew install ffmpeg youtube-dl
npm install
```

Create a file called *config.json*:

```json
{
  "port": 8080,
  "watson": {
    "speech-to-text": {
      "username": "your username",
      "password": "your password"
    },
    "tone-analyzer": {
      "username": "your username",
      "password": "your password"
    }
  }
}
```

## Running it

```sh
npm start
```
