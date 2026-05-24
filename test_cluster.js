const clusters = ['mt1','us2','us3','eu','ap1','ap2','ap3','ap4'];
let done = 0;
const total = clusters.length;

clusters.forEach(c => {
    const url = 'wss://ws-' + c + '.pusher.com/app/e912ab0d6c703b0d5c07?protocol=7&client=test&version=1.0';
    const ws = new WebSocket(url);
    const timer = setTimeout(() => { 
        console.log(c + ': TIMEOUT'); 
        try { ws.close(); } catch(e){} 
        if(++done >= total) process.exit(0); 
    }, 4000);
    
    ws.onmessage = (event) => {
        clearTimeout(timer);
        console.log(c + ': ' + event.data.toString().substring(0, 150));
        ws.close();
        if(++done >= total) process.exit(0);
    };
    ws.onerror = (e) => {
        clearTimeout(timer);
        console.log(c + ': ERROR');
        if(++done >= total) process.exit(0);
    };
});
