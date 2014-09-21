from django.forms import ModelForm
from .models import Server 

class ServerForm(ModelForm):
    class Meta:
        model = Server
        fields = ["server_name", "host", "port_no","filter_basis" ]

