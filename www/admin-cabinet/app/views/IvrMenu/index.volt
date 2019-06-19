{{ link_to("ivr-menu/modify", '<i class="add circle icon"></i> '~t._('iv_AddNewIvrMenu'), "class": "ui blue button") }}

    {% for record in ivrmenu %}
        {% if loop.first %}
            <table class="ui selectable compact table">
            <thead>
            <tr>
                <th class="centered">{{ t._('iv_Extension') }}</th>
                <th>{{ t._('iv_Name') }}</th>
                <th>{{ t._('iv_Actions') }}</th>
                <th>{{ t._('iv_TimeoutExtension') }}</th>
                <th>{{ t._('iv_Note') }}</th>
                <th></th>
            </tr>
            </thead>
            <tbody>
        {% endif %}


        <tr class="menu-row" id="{{ record.uniqid }}" >
            <td class="centered">{{ record.extension }}</td>
            <td>{{ record.name }}</td>
            <td>
                <small>
                    {% for action in record.IvrMenuActions %}
                        {{ action.digits }} - {{ action.Extensions.getRepresent() }}<br>
                    {% endfor %}
                </small>
            </td>
            <td>
                <small>
                    {% if record.TimeoutExtensions  %}
                        {{ record.TimeoutExtensions.getRepresent() }}
                    {% endif %}
                </small>
            </td>
            <td>
                {% if not (record.description is empty) %}
                    <div class="ui basic icon button" data-content="{{ record.description }}" data-position="top right" data-variation="wide">
                        <i class="file text  icon" ></i>
                    </div>
                {% endif %}
            </td>
            {{ partial("partials/tablesbuttons",
                [
                    'id': record.uniqid,
                    'edit' : 'ivr-menu/modify/',
                    'delete': 'ivr-menu/delete/'
                ])
            }}
            </tr>

        {% if loop.last %}

            </tbody>
            </table>
        {% endif %}
    {% endfor %}
