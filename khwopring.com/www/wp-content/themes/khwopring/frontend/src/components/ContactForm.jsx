import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { sendContactMessage } from '../services/contactService'

const inputClasses =
  'w-full rounded-md border border-cream-300 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:border-rust focus:outline-none focus:ring-1 focus:ring-rust dark:border-white/10 dark:bg-navy-800 dark:text-cream-100 dark:placeholder:text-cream-100/40'

export default function ContactForm({ defaultSubject = '' }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { subject: defaultSubject } })
  const [status, setStatus] = useState(null)

  async function onSubmit(values) {
    setStatus(null)
    try {
      const result = await sendContactMessage(values)
      setStatus({ type: 'success', message: result.message ?? 'Message sent successfully.' })
      reset({ name: '', email: '', phone: '', subject: defaultSubject, message: '' })
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message ?? 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <input
            className={inputClasses}
            placeholder="Your Name"
            {...register('name', { required: 'Please enter your name' })}
          />
          {errors.name && <p className="mt-1 text-sm text-rust-700">{errors.name.message}</p>}
        </div>
        <div>
          <input
            className={inputClasses}
            placeholder="Your Email"
            type="email"
            {...register('email', {
              required: 'Please enter your email',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />
          {errors.email && <p className="mt-1 text-sm text-rust-700">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input className={inputClasses} placeholder="Phone (optional)" {...register('phone')} />
        <input className={inputClasses} placeholder="Subject" {...register('subject')} />
      </div>

      <div>
        <textarea
          className={inputClasses}
          rows={5}
          placeholder="Your Message"
          {...register('message', { required: 'Please enter a message' })}
        />
        {errors.message && <p className="mt-1 text-sm text-rust-700">{errors.message.message}</p>}
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send Message'}
      </button>

      {status && (
        <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-700' : 'text-rust-700'}`}>
          {status.message}
        </p>
      )}
    </form>
  )
}
