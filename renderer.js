import { Octokit } from 'https://cdn.skypack.dev/@octokit/rest';
import { Howl } from 'https://cdn.skypack.dev/howler';

let monitoring = false;
let intervalId;
let sound;
let nextCheckTime;
let stopwatchInterval;


document.getElementById('closeBtn').addEventListener('click', () => {
  window.close();
});
  
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const githubToken = document.getElementById('githubToken').value;
  const repoName = document.getElementById('repoName').value;
  const soundFile = document.getElementById('soundFile').files[0];
  const checkInterval = parseInt(document.getElementById('checkInterval').value, 10) * 60000; // Convert to milliseconds
  const timeThreshold = parseInt(document.getElementById('timeThreshold').value, 10) * 60000; // Convert to milliseconds

  if (monitoring) {
    clearInterval(intervalId);
    clearInterval(stopwatchInterval);
    monitoring = false;
    document.getElementById('status').textContent = 'Monitoring stopped';
    document.getElementById('stopwatch').textContent = '';
    e.target.querySelector('button').textContent = 'Start Monitoring';
    return;
  }

  const octokit = new Octokit({ auth: githubToken });
  sound = new Howl({
    src: [URL.createObjectURL(soundFile)],
    format: soundFile.name.split('.').pop()
  });

  async function checkCommits() {
    console.log("Checking commits...");
    try {
      const [owner, repo] = repoName.split('/');
      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        per_page: 1,
        since: new Date(Date.now() - timeThreshold).toISOString()
      });

      if (commits.length === 0) {
        console.log("No recent commits, playing sound...");
        sound.play();
        document.getElementById('status').textContent = 'No commits within threshold, alarm triggered';
      } else {
        document.getElementById('status').textContent = 'Recent commit found, no alarm';
      }
    } catch (error) {
      console.error('Error checking commits:', error);
      document.getElementById('status').textContent = 'Error checking commits';
    }
    nextCheckTime = Date.now() + checkInterval;
  }

  function updateStopwatch() {
    const remainingTime = Math.max(0, Math.floor((nextCheckTime - Date.now()) / 1000));
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    document.getElementById('stopwatch').textContent = `Next check in: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  intervalId = setInterval(checkCommits, checkInterval);
  nextCheckTime = Date.now() + checkInterval;
  stopwatchInterval = setInterval(updateStopwatch, 1000);

  checkCommits(); // Initial check


  monitoring = true;
  e.target.querySelector('button').textContent = 'Stop Monitoring';
  document.getElementById('status').textContent = 'Monitoring started';
});
