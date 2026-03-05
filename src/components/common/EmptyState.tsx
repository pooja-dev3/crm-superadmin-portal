import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    message?: string;
    icon?: React.ElementType;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'No records found',
    message = 'Try adjusting your search or filters to find what you looking for.',
    icon: Icon = Search,
    className = ''
}) => {
    return (
        <div className={`text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200 ${className}`}>
            <div className="flex justify-center">
                <Icon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">
                {message}
            </p>
        </div>
    );
};

export default EmptyState;
