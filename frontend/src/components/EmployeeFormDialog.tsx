import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { ApiError } from '../api/client'
import type { Employee, EmployeeInput } from '../types'
import { EMPLOYMENT_TYPE_LABELS } from '../utils/format'
import { validateEmployee, type FormErrors } from '../utils/validation'

export interface EmployeeFormOptions {
  countries: string[]
  job_titles: string[]
  departments: string[]
}

interface Props {
  open: boolean
  employee: Employee | null
  options: EmployeeFormOptions
  onSubmit: (input: EmployeeInput) => Promise<void>
  onClose: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

const emptyForm = (): EmployeeInput => ({
  first_name: '',
  last_name: '',
  email: '',
  job_title: '',
  department: '',
  country: '',
  salary: '',
  employment_type: 'full_time',
  hire_date: today(),
})

const fromEmployee = (e: Employee): EmployeeInput => ({
  first_name: e.first_name,
  last_name: e.last_name,
  email: e.email,
  job_title: e.job_title,
  department: e.department,
  country: e.country,
  salary: e.salary,
  employment_type: e.employment_type,
  hire_date: e.hire_date,
})

export function EmployeeFormDialog({ open, employee, options, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<EmployeeInput>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isEdit = employee !== null

  useEffect(() => {
    if (open) {
      setForm(employee ? fromEmployee(employee) : emptyForm())
      setErrors({})
      setFormError(null)
    }
  }, [open, employee])

  const set = (field: keyof EmployeeInput) => (value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const clientErrors = validateEmployee(form)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) return

    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        job_title: form.job_title.trim(),
        department: form.department.trim(),
        country: form.country.trim().toUpperCase(),
        salary: Number(form.salary),
      })
    } catch (error) {
      if (error instanceof ApiError) {
        const serverErrors = Object.fromEntries(
          Object.entries(error.fieldErrors).map(([field, messages]) => [field, messages.join(', ')]),
        ) as FormErrors
        setErrors(serverErrors)
        setFormError(error.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const textField = (field: keyof EmployeeInput, label: string, props: Record<string, unknown> = {}) => (
    <TextField
      id={`employee-${field}`}
      label={label}
      value={form[field]}
      onChange={(e) => set(field)(e.target.value)}
      error={Boolean(errors[field])}
      helperText={errors[field] ?? ' '}
      fullWidth
      {...props}
    />
  )

  const suggestField = (field: 'job_title' | 'department' | 'country', label: string, suggestions: string[]) => (
    <Autocomplete
      freeSolo
      options={suggestions}
      inputValue={String(form[field])}
      onInputChange={(_, value) => set(field)(value)}
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          id={`employee-${field}`}
          label={label}
          error={Boolean(errors[field])}
          helperText={errors[field] ?? ' '}
        />
      )}
    />
  )

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle component="h2">{isEdit ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={1} sx={{ pt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {textField('first_name', 'First name', { autoFocus: true })}
              {textField('last_name', 'Last name')}
            </Stack>
            {textField('email', 'Email', { type: 'email' })}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {suggestField('job_title', 'Job title', options.job_titles)}
              {suggestField('department', 'Department', options.departments)}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {suggestField('country', 'Country (ISO code)', options.countries)}
              {textField('salary', 'Annual salary (USD)', { type: 'number', slotProps: { htmlInput: { min: 1, step: 100 } } })}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {textField('employment_type', 'Employment type', {
                select: true,
                children: Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                )),
              })}
              {textField('hire_date', 'Hire date', { type: 'date', slotProps: { inputLabel: { shrink: true } } })}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
