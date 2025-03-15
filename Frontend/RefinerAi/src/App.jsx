import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './components/Auth';
import Dashboard from './pages/dashboard';
import RepoViewer from './components/Repoexplorer';
import { UserProvider } from "./context/userContext";
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/auth' element={<Auth/>}/>
          <Route path='/dashboard' element={<Dashboard/>}/>
          <Route path='/repoviewer' element={<RepoViewer/>}/>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;