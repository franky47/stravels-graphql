import './config'
import server from './server'
import setupDatabase from './db/setup'

// Main Entrypoint --

setupDatabase().then(server.start)
