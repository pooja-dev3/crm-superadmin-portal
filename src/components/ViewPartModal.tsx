import React from 'react'
import { X, Package, Building, Calendar, Weight, Wrench, MapPin, Hash, ClipboardList, Info } from 'lucide-react'
import type { PartWithCustomer } from '../types/api'

interface ViewPartModalProps {
    isOpen: boolean
    onClose: () => void
    part: PartWithCustomer | null
}

const ViewPartModal: React.FC<ViewPartModalProps> = ({ isOpen, onClose, part }) => {
    if (!isOpen || !part) return null

    return (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                    onClick={onClose}
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Sticky Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
                        <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <Package className="h-6 w-6 text-blue-900" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                                    {part.part_description}
                                </h3>
                                <p className="text-sm text-gray-500 tracking-tight">Part Details • ID: {part.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 transition-colors p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Basic Information */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                                        <Info className="h-4 w-4 mr-2" />
                                        Basic Information
                                    </h4>
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Part Description</label>
                                                <p className="mt-1 text-sm text-gray-900 font-medium leading-relaxed">{part.part_description}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Drawing Number</label>
                                                    <div className="mt-1 flex items-center text-sm text-gray-900">
                                                        <Hash className="h-3.5 w-3.5 text-gray-400 mr-1" />
                                                        <span className="font-medium">{part.drawing_no}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Revision Number</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-medium">{part.rev_no || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</label>
                                                <div className="mt-1 flex items-center text-sm text-gray-900">
                                                    <Building className="h-4 w-4 text-blue-600 mr-2" />
                                                    <span className="font-semibold">{part.customer.name}</span>
                                                </div>
                                            </div>
                                            <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 mt-2">
                                                <div className="flex items-center">
                                                    <Calendar className="h-3.5 w-3.5 mr-1" />
                                                    Created: {new Date(part.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                    ID: {part.id}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Technical Specifications */}
                                <div>
                                    <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 mt-2">
                                        <Wrench className="h-4 w-4 mr-2" />
                                        Technical Specifications
                                    </h4>
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Weight</label>
                                                <div className="mt-1 flex items-center text-sm text-gray-900 font-medium">
                                                    <Weight className="h-4 w-4 text-gray-400 mr-2" />
                                                    {part.net_wt} kg
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Thickness</label>
                                                <p className="mt-1 text-sm text-gray-900 font-medium">{part.thickness} mm</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Raw Material</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">{part.raw_material || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Lead Time</label>
                                            <div className="mt-1 flex items-center text-sm text-blue-700 font-bold">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {part.lead_time} Days
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Manufacturing & PO Details */}
                            <div className="space-y-6">
                                <div>
                                    <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">
                                        <ClipboardList className="h-4 w-4 mr-2" />
                                        Manufacturing Details
                                    </h4>
                                    <div className="bg-gray-50 rounded-xl p-5 space-y-4 shadow-sm border border-gray-100">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Tool Information</label>
                                            <p className="mt-1 text-sm text-gray-900 font-medium">{part.tool_information || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Drawing Location</label>
                                            <div className="mt-1 flex items-center text-sm text-gray-900 font-medium">
                                                <MapPin className="h-4 w-4 text-red-500 mr-2" />
                                                {part.drawing_location || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Operation Sequence</label>
                                            <div className="mt-1 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                                                {part.operation_sequence || 'No sequence defined'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Purchase Order Information */}
                                {(part.po_no || part.po_date || part.po_qty) && (
                                    <div>
                                        <h4 className="flex items-center text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 mt-2">
                                            <Hash className="h-4 w-4 mr-2" />
                                            PO Information
                                        </h4>
                                        <div className="bg-blue-50/50 rounded-xl p-5 space-y-4 shadow-sm border border-blue-100">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-900/60 uppercase tracking-wider">PO Number</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-bold">{part.po_no || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-900/60 uppercase tracking-wider">PO Date</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-medium">
                                                        {part.po_date ? new Date(part.po_date).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-900/60 uppercase tracking-wider">PO Quantity</label>
                                                    <p className="mt-1 text-sm text-gray-900 font-bold">{part.po_qty || 0}</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-900/60 uppercase tracking-wider">Status</label>
                                                    <p className={`mt-1 text-sm font-bold ${part.po_received ? 'text-green-600' : 'text-orange-600'}`}>
                                                        {part.po_received ? 'PO Received' : 'Draft / Pending'}
                                                    </p>
                                                </div>
                                            </div>
                                            {part.acknowledgement_remarks && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-blue-900/60 uppercase tracking-wider">Remarks</label>
                                                    <p className="mt-1 text-sm text-gray-700 italic">{part.acknowledgement_remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 z-10">
                        <button
                            type="button"
                            className="px-6 py-2.5 bg-blue-900 text-white text-sm font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2"
                            onClick={onClose}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewPartModal
