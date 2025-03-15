import React from 'react'
import Repos from '../components/Repos'
import Header from '../components/header'
import RepoSidebars from '../components/RepoSidebars'

function dashboard() {
  return (
    <div>
        <Header/>
        <div className='flex'>
          <RepoSidebars/>
          <Repos/>
        </div>
   
    </div>
  )
}

export default dashboard