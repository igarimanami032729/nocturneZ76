import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TitleScreen } from './components/TitleScreen';
import { NameInputScreen } from './components/NameInputScreen';
import { IntroScreen } from './components/IntroScreen';
import { GameScreen } from './components/GameScreen';
import { EndingScreen } from './components/EndingScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TitleScreen />} />
        <Route path="/name" element={<NameInputScreen />} />
        <Route path="/intro" element={<IntroScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/ending" element={<EndingScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
