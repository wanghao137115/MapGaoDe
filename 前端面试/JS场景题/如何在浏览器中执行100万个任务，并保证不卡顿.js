async function processLargeTaskAsync(task,chunkSize){
    for(let i = 0;i<task.length;i++){
        const chunk = task.slice(i,i+chunkSize)
        for(const task of chunk){
            processTaks(chunk)
        }
        await new Promise(reolve => {
            setTimeout(()=>{
                reolve
            },0)
        })
    }
}

// 浏览器空闲时期调用函数，页面流畅
function processLargeTaskWithIdleCallback(tasks,chunkSize){
    let index = 0

    function doChunk(deadline){
        while(index<tasks.length && deadline.timeRemaining()>0){
            processTask(tasks[index])
        }

        if(index < tasks.length){
            requestIdleCallback(doChunk)
        }
    }

    requestIdleCallback(doChunk)
}