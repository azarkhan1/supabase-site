import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

export const pdfGenerator = {
  exportToPDF: async (elementId, fileName = 'invoice.pdf') => {
    const element = document.getElementById(elementId)

    if (!element) {
      toast.error('المان فاکتور پیدا نشد. مطمئن شو InvoiceTemplate تو صفحه رندر شده')
      return
    }

    const toastId = toast.loading('در حال تولید PDF...')

    try {
      // 1. صبر کن فونت لود شه
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(element, {
        scale: 3, // کیفیت بالاتر
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        // 2. این مهمه: همه رنگ‌های Tailwind رو دستی اووراید کن
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId)
          if (el) {
            el.style.backgroundColor = '#ffffff'
            el.style.color = '#000000'
            // همه بچه‌هاشم رنگشون مشکی شه
            el.querySelectorAll('*').forEach(child => {
              child.style.color = '#000000'
              if (window.getComputedStyle(child).backgroundColor!== 'rgba(0, 0, 0, 0)') {
                child.style.backgroundColor = 'transparent'
              }
            })
          }
        }
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)

      const finalWidth = imgWidth * ratio
      const finalHeight = imgHeight * ratio
      const x = (pdfWidth - finalWidth) / 2

      pdf.addImage(imgData, 'PNG', x, 0, finalWidth, finalHeight)
      pdf.save(fileName)

      toast.success('PDF دانلود شد', { id: toastId })

    } catch (error) {
      console.error('PDF Error:', error)
      toast.error('خطا در تولید PDF', { id: toastId })
    }
  }
}