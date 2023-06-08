const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const nsfw = require('nsfwjs');

const images = [
];

((async () => {
  const model = await nsfw.load()

  console.log(await Promise.all(images.map(async (imageUrl) => {
    const pic = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    })

    const image = await tf.node.decodeImage(pic.data, 3)
    const predictions = await model.classify(image)
    image.dispose() // Tensor memory must be managed explicitly (it is not sufficient to let a tf.Tensor go out of scope for its memory to be released).

    return [imageUrl, (Object.fromEntries(predictions.map(({ className, probability }) => [className.toLowerCase(), probability])))]
  })))
})()
)