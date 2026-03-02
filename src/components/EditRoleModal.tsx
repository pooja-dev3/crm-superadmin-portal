import React, { useState, useEffect } from 'react'
import { X, Shield } from 'lucide-react'
import { superadminApi } from '../services'
import { useToast } from '../contexts/ToastContext'

interface Role {
    id: string
    name: string
    description: string
    permissions: string[]
}

interface EditRoleModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    role: Role | null
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({ isOpen, onClose, onSuccess, role }) => {
    const { addToast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as string[]
    })

    useEffect(() => {
        if (role && isOpen) {
            setFormData({
                name: role.name,
                description: role.description,
                permissions: role.permissions || []
            })
        }
    }, [role, isOpen])

    const availablePermissions = [
        { id: 'manage_company', label: 'Manage Company', description: 'Create, edit, and delete companies' },
        { id: 'manage_users', label: 'Manage Users', description: 'Add, edit, and remove users' },
        { id: 'view_reports', label: 'View Reports', description: 'Access system reports and analytics' },
        { id: 'manage_orders', label: 'Manage Orders', description: 'Process and manage orders' },
        { id: 'manage_challans', label: 'Manage Delivery Challans', description: 'Handle delivery documentation' },
        { id: 'system_settings', label: 'System Settings', description: 'Modify system configuration' }
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePermissionToggle = (permissionId: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!role) return
        if (!formData.name.trim()) {
            addToast('Role name is required', 'error')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await superadminApi.updateRole(role.id, formData) as any
            if (response.success) {
                addToast('Role updated successfully', 'success')
                onSuccess()
                onClose()
            } else {
                addToast(response.message || 'Failed to update role', 'error')
            }
        } catch (error) {
            console.error('Error updating role:', error)
            addToast('Error updating role', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen || !role) return null

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Edit Role: {role.name}
                                </h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">
                                        Role Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="edit_name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="edit_description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-900 focus:border-blue-900 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Permissions
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 text-gray-600">
                                        {availablePermissions.map(permission => (
                                            <div
                                                key={permission.id}
                                                onClick={() => handlePermissionToggle(permission.id)}
                                                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${formData.permissions.includes(permission.id)
                                                        ? 'border-blue-900 bg-blue-50'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Shield className={`h-4 w-4 mt-0.5 mr-2 ${formData.permissions.includes(permission.id) ? 'text-blue-900' : 'text-gray-400'
                                                    }`} />
                                                <div>
                                                    <p className="text-sm font-medium">{permission.label}</p>
                                                    <p className="text-xs text-gray-500 line-clamp-1">{permission.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-900 text-base font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:ml-3 sm:w-auto sm:text-sm transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditRoleModal
