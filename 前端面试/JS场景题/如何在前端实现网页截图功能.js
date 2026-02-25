// 如何前端实现网页截图功能，可以将部分或整个页面的内容保存为图片
import html2canvas from 'html2canvas'

const captureElement = (element) => {
    const canvas = await html2canvas(element)
    const image = canvas.toDataUrl('image/png')
    return Image

}


// 元素canvas API  dom-to-image