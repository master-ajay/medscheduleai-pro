#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const environments = ['development', 'test'];
const projects = ['client', 'server'];

function createEnvFile(projectPath, env) {
  const examplePath = path.join(projectPath, '.env.example');
  const envPath = path.join(projectPath, `.env.${env}`);
  
  if (fs.existsSync(examplePath) && !fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log(`✅ Created ${envPath}`);
  } else if (fs.existsSync(envPath)) {
    console.log(`⚠️  ${envPath} already exists, skipping...`);
  } else {
    console.log(`❌ ${examplePath} not found`);
  }
}

function main() {
  console.log('🚀 Setting up development environment...\n');
  
  projects.forEach(project => {
    console.log(`📁 Setting up ${project} environment files:`);
    const projectPath = path.join(__dirname, '../../', project);
    
    environments.forEach(env => {
      createEnvFile(projectPath, env);
    });
    
    console.log('');
  });
  
  console.log('✨ Environment setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Update environment variables with your actual values');
  console.log('2. Set up MongoDB and Redis connections');
  console.log('3. Get OpenAI API key from https://platform.openai.com/');
  console.log('4. Run `npm run dev` to start development servers');
}

main();