import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { api as defaultApi, type Api } from '../api'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmployeeFormDialog } from '../components/EmployeeFormDialog'
import { FilterSelect } from '../components/FilterSelect'
import { useAsync } from '../hooks/useAsync'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { Employee, EmployeeInput, EmployeeListParams } from '../types'
import { countryLabel, EMPLOYMENT_TYPE_LABELS, formatCurrency } from '../utils/format'

type SortKey = 'full_name' | 'job_title' | 'department' | 'country' | 'salary' | 'hire_date'

const COLUMNS: Array<{ key: SortKey; label: string; align?: 'right' }> = [
  { key: 'full_name', label: 'Name' },
  { key: 'job_title', label: 'Job title' },
  { key: 'department', label: 'Department' },
  { key: 'country', label: 'Country' },
  { key: 'salary', label: 'Salary (USD)', align: 'right' },
  { key: 'hire_date', label: 'Hire date' },
]

const toOptions = (values: string[] = [], label: (v: string) => string = (v) => v) => values.map((value) => ({ value, label: label(value) }))

export function EmployeesPage({ api = defaultApi }: { api?: Api }) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ country: '', job_title: '', department: '' })
  const [sort, setSort] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'full_name', direction: 'asc' })
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(25)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const q = useDebouncedValue(search.trim(), 300)

  const params: EmployeeListParams = { q, ...filters, sort: sort.key, direction: sort.direction, page: page + 1, per_page: perPage }
  const list = useAsync(() => api.listEmployees(params), [JSON.stringify(params)])
  const options = useAsync(() => api.filterOptions(), [])

  const updateFilter = (key: keyof typeof filters) => (value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(0)
  }

  const toggleSort = (key: SortKey) => {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }))
    setPage(0)
  }

  const refresh = (message: string) => {
    setToast(message)
    list.reload()
    options.reload()
  }

  const handleSubmit = async (input: EmployeeInput) => {
    if (editing) {
      await api.updateEmployee(editing.id, input)
      refresh('Employee updated')
    } else {
      await api.createEmployee(input)
      refresh('Employee added')
    }
    setFormOpen(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.deleteEmployee(deleting.id)
      refresh(`${deleting.full_name} was removed`)
      setDeleting(null)
    } catch {
      setToast('Could not delete employee. Please try again.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const openForm = (employee: Employee | null) => {
    setEditing(employee)
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  const employees = list.data?.data ?? []
  const total = list.data?.meta.total ?? 0

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" component="h1">
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total.toLocaleString('en-US')} employees
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)}>
          Add employee
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            id="employee-search"
            type="search"
            size="small"
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ flex: 1 }}
          />
          <FilterSelect id="filter-country" label="Country" emptyLabel="All countries" value={filters.country} options={toOptions(options.data?.countries, countryLabel)} onChange={updateFilter('country')} />
          <FilterSelect id="filter-job-title" label="Job title" emptyLabel="All job titles" value={filters.job_title} options={toOptions(options.data?.job_titles)} onChange={updateFilter('job_title')} minWidth={200} />
          <FilterSelect id="filter-department" label="Department" emptyLabel="All departments" value={filters.department} options={toOptions(options.data?.departments)} onChange={updateFilter('department')} />
        </Stack>
      </Paper>

      {Boolean(list.error) && <Alert severity="error">Could not load employees. Is the API running?</Alert>}

      <Paper variant="outlined">
        {list.loading && <LinearProgress aria-label="Loading employees" />}
        <TableContainer>
          <Table size="small" aria-label="Employees">
            <TableHead>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableCell key={column.key} align={column.align} sortDirection={sort.key === column.key ? sort.direction : false}>
                    <TableSortLabel active={sort.key === column.key} direction={sort.key === column.key ? sort.direction : 'asc'} onClick={() => toggleSort(column.key)}>
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell>Type</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {employee.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {employee.email}
                    </Typography>
                  </TableCell>
                  <TableCell>{employee.job_title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{countryLabel(employee.country)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(employee.salary)}
                  </TableCell>
                  <TableCell>{employee.hire_date}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={EMPLOYMENT_TYPE_LABELS[employee.employment_type]} />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" aria-label={`Edit ${employee.full_name}`} onClick={() => openForm(employee)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" aria-label={`Delete ${employee.full_name}`} onClick={() => setDeleting(employee)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!list.loading && employees.length === 0 && !list.error && (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length + 2} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No employees match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={total === 0 ? 0 : page}
          rowsPerPage={perPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value))
            setPage(0)
          }}
        />
      </Paper>

      <EmployeeFormDialog
        key={formKey}
        open={formOpen}
        employee={editing}
        options={{ countries: options.data?.countries ?? [], job_titles: options.data?.job_titles ?? [], departments: options.data?.departments ?? [] }}
        onSubmit={handleSubmit}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete employee?"
        message={deleting ? `${deleting.full_name} will be permanently removed. This cannot be undone.` : ''}
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />

      <Snackbar open={toast !== null} autoHideDuration={4000} onClose={() => setToast(null)} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Stack>
  )
}
