import { useEffect } from "react"

export default function RazorpayButton() {
    useEffect(() => {
        const d = document
        const scriptId = 'razorpay-embed-btn-js'
        const existingScript = d.getElementById(scriptId)

        if (!existingScript) {
            const s = d.createElement('script')
            s.defer = true
            s.id = scriptId
            s.src = 'https://cdn.razorpay.com/static/embed_btn/bundle.js'
            d.body.appendChild(s)
        } else {
            const rzp = (window as any)['__rzp__']
            if (rzp && rzp.init) rzp.init()
        }
    }, [])

    return (
        <div className="hover:scale-105 active:scale-95 transition-all duration-300">
            <div
                className="razorpay-embed-btn"
                data-url="https://pages.razorpay.com/pl_SWXfLwNjb0ftzv/view"
                data-text="Buy Us Coffee ☕"
                data-color="#F97316"
                data-size="large"
            />
        </div>
    )
}
