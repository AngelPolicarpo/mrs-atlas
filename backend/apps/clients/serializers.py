from rest_framework import serializers

from .models import Client, ClientDocument


class ClientDocumentSerializer(serializers.ModelSerializer):
    """Serializer para documentos de cliente."""
    
    uploaded_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientDocument
        fields = [
            'id',
            'title',
            'document_type',
            'file',
            'description',
            'uploaded_by',
            'uploaded_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']
    
    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name()
        return None
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class ClientSerializer(serializers.ModelSerializer):
    """Serializer para Cliente."""
    
    documents = ClientDocumentSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'cpf',
            'address',
            'city',
            'state',
            'zip_code',
            'company',
            'cnpj',
            'lgpd_consent',
            'lgpd_consent_date',
            'marketing_consent',
            'notes',
            'is_active',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
            'documents',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None
    
    def create(self, validated_data):
        from django.utils import timezone
        
        validated_data['created_by'] = self.context['request'].user
        
        if validated_data.get('lgpd_consent'):
            validated_data['lgpd_consent_date'] = timezone.now()
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        from django.utils import timezone
        
        # Atualiza data de consentimento se mudou para True
        if validated_data.get('lgpd_consent') and not instance.lgpd_consent:
            validated_data['lgpd_consent_date'] = timezone.now()
        
        return super().update(instance, validated_data)


class ClientListSerializer(serializers.ModelSerializer):
    """Serializer resumido para listagem de clientes."""
    
    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'company',
            'is_active',
            'created_at',
        ]
