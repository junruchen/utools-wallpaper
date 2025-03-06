import { sample } from 'lodash-es';
import wavesColors from './wavesColors.json'

export default function getRandomColor(isDarkMode) {
  const suitableColors = wavesColors.filter(color => 
    isDarkMode ? color.darkSuitable : color.lightSuitable
  )
  const randomColor = sample(suitableColors)
  return {
    name: randomColor.name,
    color: randomColor.hex
   }
}